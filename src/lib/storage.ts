import type { GlucoseReading, InsulinLog, ReminderConfig, MealAnalysis, UserProfile, ActivityLog } from '@/types';
import { supabase } from './supabaseClient';
import { classifyGlucoseLevel, generateId } from './utils';
import { toast } from '@/hooks/use-toast'; // Import toast

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    // This is a genuine error from the Supabase API
    console.error('Error fetching user session:', error);
    throw error;
  }

  if (!session?.user?.id) {
    // This is an expected state for a logged-out user.
    // We shouldn't log this as an error, just throw for upstream handling.
    throw new Error('Usuário não autenticado.');
  }

  return session.user.id;
}

// Helper function to upload file to Supabase Storage
async function uploadSupabaseFile(bucketName: string, filePath: string, file: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: true, // Overwrite if file already exists (e.g., for profile picture update)
    });

  if (error) {
    console.error(`Error uploading file to Supabase Storage bucket "${bucketName}":`, error);
    throw new Error(`Falha ao enviar arquivo para ${bucketName}: ${error.message}`);
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  
  if (!publicUrl) {
    console.error(`Error getting public URL for ${data.path} in bucket ${bucketName}`);
    throw new Error('Não foi possível obter a URL pública do arquivo enviado.');
  }
  return publicUrl;
}


// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { 
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    if (!data) { 
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            const defaultProfile: UserProfile = {
                id: user.id,
                name: user.user_metadata?.full_name || user.email || 'Novo Usuário',
                email: user.email || '',
                avatarUrl: user.user_metadata?.avatar_url || undefined,
                languagePreference: 'pt-BR', // Default language
                // Metas padrão podem ser nulas/undefined inicialmente
                target_glucose_low: undefined, 
                target_glucose_high: undefined,
                hypo_glucose_threshold: undefined, 
                hyper_glucose_threshold: undefined,
            };
            return defaultProfile;
        }
        return null;
    }

    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      avatarUrl: data.avatar_url || undefined,
      dateOfBirth: data.date_of_birth || undefined,
      diabetesType: data.diabetes_type as UserProfile['diabetesType'] || undefined,
      languagePreference: data.language_preference || 'pt-BR',
      target_glucose_low: data.target_glucose_low === null ? undefined : data.target_glucose_low,
      target_glucose_high: data.target_glucose_high === null ? undefined : data.target_glucose_high,
      hypo_glucose_threshold: data.hypo_glucose_threshold === null ? undefined : data.hypo_glucose_threshold,
      hyper_glucose_threshold: data.hyper_glucose_threshold === null ? undefined : data.hyper_glucose_threshold,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile, avatarFile?: File): Promise<UserProfile> {
  const userId = await getCurrentUserId();
  if (userId !== profile.id) {
    throw new Error("Não é possível salvar o perfil de outro usuário.");
  }

  let newUploadedAvatarUrl: string | undefined = profile.avatarUrl; 

  if (avatarFile) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `profile.${fileExt}`;
    const filePath = `users/${userId}/${fileName}`; 
    try {
      newUploadedAvatarUrl = await uploadSupabaseFile('profile-pictures', filePath, avatarFile);
    } catch (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      toast({
        title: "Falha no Upload da Foto",
        description: "Sua foto de perfil não pôde ser enviada. As outras informações do perfil foram salvas. Tente enviar a foto novamente mais tarde.",
        variant: "destructive",
      });
    }
  }

  const profileDataToSave = {
    id: profile.id,
    name: profile.name,
    avatar_url: newUploadedAvatarUrl, 
    date_of_birth: profile.dateOfBirth || null,
    diabetes_type: profile.diabetesType || null,
    language_preference: profile.languagePreference || 'pt-BR',
    target_glucose_low: profile.target_glucose_low === undefined ? null : profile.target_glucose_low,
    target_glucose_high: profile.target_glucose_high === undefined ? null : profile.target_glucose_high,
    hypo_glucose_threshold: profile.hypo_glucose_threshold === undefined ? null : profile.hypo_glucose_threshold,
    hyper_glucose_threshold: profile.hyper_glucose_threshold === undefined ? null : profile.hyper_glucose_threshold,
    updated_at: new Date().toISOString(),
  };
    
  const { data: savedData, error } = await supabase
    .from('profiles')
    .upsert(profileDataToSave, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving user profile data:', error);
    throw error;
  }
  
  return {
      id: savedData.id,
      name: savedData.name || '',
      email: profile.email, 
      avatarUrl: savedData.avatar_url || undefined,
      dateOfBirth: savedData.date_of_birth || undefined,
      diabetesType: savedData.diabetes_type as UserProfile['diabetesType'] || undefined,
      languagePreference: savedData.language_preference || 'pt-BR',
      target_glucose_low: savedData.target_glucose_low === null ? undefined : savedData.target_glucose_low,
      target_glucose_high: savedData.target_glucose_high === null ? undefined : savedData.target_glucose_high,
      hypo_glucose_threshold: savedData.hypo_glucose_threshold === null ? undefined : savedData.hypo_glucose_threshold,
      hyper_glucose_threshold: savedData.hyper_glucose_threshold === null ? undefined : savedData.hyper_glucose_threshold,
      created_at: savedData.created_at,
      updated_at: savedData.updated_at,
  };
}


// Glucose Readings
export async function getGlucoseReadings(userProfile?: UserProfile | null): Promise<GlucoseReading[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('glucose_readings')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching glucose readings:', error);
    throw error;
  }
  return data.map(r => ({
    id: r.id,
    user_id: r.user_id,
    value: r.value,
    timestamp: r.timestamp,
    mealContext: r.meal_context as GlucoseReading['mealContext'] || undefined,
    notes: r.notes || undefined,
    level: classifyGlucoseLevel(r.value, userProfile) as GlucoseReading['level'] || undefined, 
    created_at: r.created_at,
  }));
}

export async function saveGlucoseReading(reading: Omit<GlucoseReading, 'level' | 'user_id' | 'created_at'> & {id?: string}, userProfile?: UserProfile | null): Promise<GlucoseReading> {
  const userId = await getCurrentUserId();
  const level = classifyGlucoseLevel(reading.value, userProfile);
  
  const readingToSave = {
    id: reading.id, 
    value: reading.value,
    timestamp: reading.timestamp,
    meal_context: reading.mealContext || null,
    notes: reading.notes || null,
    user_id: userId,
    level: level,
  };

  if (reading.id) { 
    const { id, ...updateData } = readingToSave;
    const { data: updatedDbData, error } = await supabase
      .from('glucose_readings')
      .update(updateData)
      .eq('id', reading.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { 
        ...updatedDbData, 
        mealContext: updatedDbData.meal_context as GlucoseReading['mealContext'] || undefined,
        notes: updatedDbData.notes || undefined,
        level: classifyGlucoseLevel(updatedDbData.value, userProfile) as GlucoseReading['level'] || undefined,
    } as GlucoseReading;
  } else { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...insertData } = readingToSave; 
    const { data: insertedDbData, error } = await supabase
      .from('glucose_readings')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
     return { 
        ...insertedDbData, 
        mealContext: insertedDbData.meal_context as GlucoseReading['mealContext'] || undefined,
        notes: insertedDbData.notes || undefined,
        level: classifyGlucoseLevel(insertedDbData.value, userProfile) as GlucoseReading['level'] || undefined,
    } as GlucoseReading;
  }
}

export async function deleteGlucoseReading(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('glucose_readings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting glucose reading:', error);
    throw error;
  }
}


// Insulin Logs
export async function getInsulinLogs(): Promise<InsulinLog[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('insulin_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data.map(log => ({
      id: log.id,
      user_id: log.user_id,
      type: log.type,
      dose: log.dose,
      timestamp: log.timestamp,
      created_at: log.created_at,
  }));
}

export async function saveInsulinLog(log: Omit<InsulinLog, 'user_id' | 'created_at'> & {id?:string}): Promise<InsulinLog> {
  const userId = await getCurrentUserId();
  const logToSave = {
    id: log.id,
    type: log.type,
    dose: log.dose,
    timestamp: log.timestamp,
    user_id: userId,
  };

  if (log.id) { 
    const { id, ...updateData } = logToSave;
    const { data, error } = await supabase
      .from('insulin_logs')
      .update(updateData)
      .eq('id', log.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as InsulinLog;
  } else { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...insertData } = logToSave;
    const { data, error } = await supabase
      .from('insulin_logs')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return data as InsulinLog;
  }
}

export async function deleteInsulinLog(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('insulin_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}


// Meal Analyses
export async function getMealAnalyses(): Promise<MealAnalysis[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('meal_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(a => ({
    id: a.id,
    user_id: a.user_id,
    timestamp: a.timestamp, 
    imageUrl: a.image_url || undefined,
    originalImageFileName: a.original_image_file_name || undefined,
    foodIdentification: a.food_identification,
    macronutrientEstimates: a.macronutrient_estimates as MealAnalysis['macronutrientEstimates'],
    estimatedGlucoseImpact: a.estimated_glucose_impact,
    suggestedInsulinDose: a.suggested_insulin_dose,
    improvementTips: a.improvement_tips,
    created_at: a.created_at,
  }));
}

export async function saveMealAnalysis(
  analysis: Omit<MealAnalysis, 'id' | 'imageUrl' | 'user_id' | 'created_at'> & { id?: string; mealPhotoFile?: File }
): Promise<MealAnalysis> {
  const userId = await getCurrentUserId();
  let finalImageUrl: string | undefined = undefined;

  if (analysis.mealPhotoFile) {
    const file = analysis.mealPhotoFile;
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${generateId()}.${fileExt}`;
    const filePath = `users/${userId}/meals/${fileName}`;
    try {
      finalImageUrl = await uploadSupabaseFile('meal-photos', filePath, file);
    } catch (uploadError) {
       console.error("Error uploading meal photo, analysis will be saved without image URL:", uploadError);
       toast({
        title: "Falha no Upload da Foto da Refeição",
        description: "A foto da refeição não pôde ser enviada, mas a análise foi salva. Tente editar a análise para adicionar a foto mais tarde, se necessário.",
        variant: "destructive",
      });
    }
  }
  
  const analysisDataToSave = {
    user_id: userId,
    timestamp: analysis.timestamp,
    image_url: finalImageUrl,
    original_image_file_name: analysis.originalImageFileName || null,
    food_identification: analysis.foodIdentification,
    macronutrient_estimates: analysis.macronutrientEstimates,
    estimated_glucose_impact: analysis.estimatedGlucoseImpact,
    suggested_insulin_dose: analysis.suggestedInsulinDose,
    improvement_tips: analysis.improvementTips,
  };
  
  let savedData;
  if (analysis.id) {
    const { data, error } = await supabase
      .from('meal_analyses')
      .update(analysisDataToSave)
      .eq('id', analysis.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    savedData = data;
  } else { 
    const { data, error } = await supabase
      .from('meal_analyses')
      .insert(analysisDataToSave)
      .select()
      .single();
    if (error) throw error;
    savedData = data;
  }
  
  return {
    id: savedData.id,
    user_id: savedData.user_id,
    timestamp: savedData.timestamp,
    imageUrl: savedData.image_url || undefined,
    originalImageFileName: savedData.original_image_file_name || undefined,
    foodIdentification: savedData.food_identification,
    macronutrientEstimates: savedData.macronutrient_estimates as MealAnalysis['macronutrientEstimates'],
    estimatedGlucoseImpact: savedData.estimated_glucose_impact,
    suggestedInsulinDose: savedData.suggested_insulin_dose,
    improvementTips: savedData.improvement_tips,
    created_at: savedData.created_at,
  };
}

export async function deleteMealAnalysis(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { data: analysisToDelete, error: fetchError } = await supabase
    .from('meal_analyses')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { 
    console.error('Error fetching meal analysis for deletion:', fetchError);
    throw fetchError;
  }

  if (analysisToDelete && analysisToDelete.image_url) {
    try {
      const filePath = new URL(analysisToDelete.image_url).pathname.split('/meal-photos/').pop();
      if (filePath) {
        await supabase.storage.from('meal-photos').remove([filePath]);
      }
    } catch (storageError) {
      console.error("Error deleting meal photo from storage, record will still be deleted:", storageError);
    }
  }

  const { error: deleteDbError } = await supabase
    .from('meal_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (deleteDbError) {
    console.error('Error deleting meal analysis record:', deleteDbError);
    throw deleteDbError;
  }
}

// Reminders
export async function getReminders(): Promise<ReminderConfig[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('time', { ascending: true });

  if (error) throw error;
  return data.map(r => ({
    id: r.id,
    user_id: r.user_id,
    type: r.type as ReminderConfig['type'],
    name: r.name,
    time: r.time.substring(0,5), 
    days: r.days as ReminderConfig['days'],
    enabled: r.enabled,
    insulinType: r.insulin_type || undefined,
    insulinDose: r.insulin_dose || undefined,
    isSimulatedCall: r.is_simulated_call || undefined,
    simulatedCallContact: r.simulated_call_contact || undefined,
    customSound: r.custom_sound || undefined,
    created_at: r.created_at,
  }));
}

export async function saveReminder(reminder: Omit<ReminderConfig, 'user_id' | 'created_at'> & { id?: string }): Promise<ReminderConfig> {
  const userId = await getCurrentUserId();
  const reminderToSave = {
    id: reminder.id,
    user_id: userId,
    type: reminder.type,
    name: reminder.name,
    time: `${reminder.time}:00`, 
    days: reminder.days,
    enabled: reminder.enabled,
    insulin_type: reminder.insulinType || null,
    insulin_dose: reminder.insulinDose || null,
    is_simulated_call: reminder.isSimulatedCall || null,
    simulated_call_contact: reminder.simulatedCallContact || null,
    custom_sound: reminder.customSound || null,
  };
  
  let savedData;
  if (reminder.id) { 
    const { id, ...updateData } = reminderToSave;
    const { data, error: updateError } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', reminder.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (updateError) throw updateError;
    savedData = data;
  } else { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...insertData } = reminderToSave;
    const { data, error: insertError } = await supabase
      .from('reminders')
      .insert(insertData)
      .select()
      .single();
    if (insertError) throw insertError;
    savedData = data;
  }
  
  return { 
    id: savedData.id,
    user_id: savedData.user_id,
    type: savedData.type as ReminderConfig['type'],
    name: savedData.name,
    time: savedData.time.substring(0,5),
    days: savedData.days as ReminderConfig['days'],
    enabled: savedData.enabled,
    insulinType: savedData.insulin_type || undefined,
    insulinDose: savedData.insulin_dose || undefined,
    isSimulatedCall: savedData.is_simulated_call || undefined,
    simulatedCallContact: savedData.simulated_call_contact || undefined,
    customSound: savedData.custom_sound || undefined,
    created_at: savedData.created_at,
  };
}

export async function deleteReminder(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}


// Activity Logs
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
  return data.map(log => ({
    id: log.id,
    user_id: log.user_id,
    timestamp: log.timestamp,
    activity_type: log.activity_type,
    duration_minutes: log.duration_minutes,
    intensity: log.intensity as ActivityLog['intensity'] || undefined,
    notes: log.notes || undefined,
    created_at: log.created_at,
  }));
}

export async function saveActivityLog(log: Omit<ActivityLog, 'user_id' | 'created_at'> & { id?: string }): Promise<ActivityLog> {
  const userId = await getCurrentUserId();
  const logToSave = {
    id: log.id,
    user_id: userId,
    timestamp: log.timestamp,
    activity_type: log.activity_type,
    duration_minutes: log.duration_minutes,
    intensity: log.intensity || null,
    notes: log.notes || null,
  };

  let savedData;
  if (log.id) {
    const { id, ...updateData } = logToSave;
    const { data, error } = await supabase
      .from('activity_logs')
      .update(updateData)
      .eq('id', log.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    savedData = data;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...insertData } = logToSave;
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    savedData = data;
  }
  
  return {
    ...savedData,
    intensity: savedData.intensity as ActivityLog['intensity'] || undefined,
    notes: savedData.notes || undefined,
  } as ActivityLog;
}

export async function deleteActivityLog(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting activity log:', error);
    throw error;
  }
}
