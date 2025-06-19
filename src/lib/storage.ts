
import type { GlucoseReading, InsulinLog, ReminderConfig, MealAnalysis, UserProfile } from '@/types';
import { supabase } from './supabaseClient';
import { classifyGlucoseLevel, generateId } from './utils';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    console.error('Error getting user session or user ID:', error);
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
                avatarUrl: user.user_metadata?.avatar_url || undefined, // Initially undefined, or a placeholder
                dateOfBirth: undefined,
                diabetesType: undefined,
            };
            await saveUserProfile(defaultProfile); 
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

  let publicAvatarUrl = profile.avatarUrl;

  if (avatarFile) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `profile.${fileExt}`;
    // Path structure: users/{user_id}/profile.ext
    const filePath = `users/${userId}/${fileName}`; 
    try {
      publicAvatarUrl = await uploadSupabaseFile('profile-pictures', filePath, avatarFile);
    } catch (uploadError) {
      console.error("Error uploading avatar, profile will be saved without new avatar:", uploadError);
      // Decide if you want to throw or save profile with old/no avatar
      // For now, we'll let it save with the old avatarUrl if upload fails
    }
  }

  const profileDataToSave = {
    id: profile.id,
    name: profile.name,
    // email: profile.email, // Email updates are usually handled by auth.updateUser()
    avatar_url: publicAvatarUrl,
    date_of_birth: profile.dateOfBirth,
    diabetes_type: profile.diabetesType,
    updated_at: new Date().toISOString(),
  };
  
  // Only include email if it's different and you intend to update it here (might need special RLS)
  // For now, assuming email comes from auth and is not directly updated via profile save
  const { email, ...restOfProfileData } = profileDataToSave;


  const { data: savedData, error } = await supabase
    .from('profiles')
    .upsert(profile.email ? profileDataToSave : restOfProfileData , { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
  
  return { // Return the updated profile in UserProfile format
      id: savedData.id,
      name: savedData.name || '',
      email: savedData.email || profile.email, // use profile.email as fallback if not in savedData
      avatarUrl: savedData.avatar_url || undefined,
      dateOfBirth: savedData.date_of_birth || undefined,
      diabetesType: savedData.diabetes_type as UserProfile['diabetesType'] || undefined,
      created_at: savedData.created_at,
      updated_at: savedData.updated_at,
  };
}


// Glucose Readings
export async function getGlucoseReadings(): Promise<GlucoseReading[]> {
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
    level: r.level as GlucoseReading['level'] || undefined,
    created_at: r.created_at,
  }));
}

export async function saveGlucoseReading(reading: Omit<GlucoseReading, 'level' | 'user_id' | 'created_at'>): Promise<GlucoseReading> {
  const userId = await getCurrentUserId();
  const level = classifyGlucoseLevel(reading.value);
  
  const readingToSave = {
    ...reading, // Includes id if present (for update), value, timestamp, mealContext, notes
    user_id: userId,
    level: level,
    meal_context: reading.mealContext || null, // Ensure null for DB if undefined
    notes: reading.notes || null, // Ensure null for DB if undefined
  };
  // Remove potentially undefined fields that DB might not like if not explicitly nullable
  if (readingToSave.mealContext === undefined) delete readingToSave.mealContext;
  if (readingToSave.notes === undefined) delete readingToSave.notes;


  if (reading.id) { 
    const { id, ...updateData } = readingToSave;
    const { data, error } = await supabase
      .from('glucose_readings')
      .update(updateData)
      .eq('id', reading.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...data, mealContext: data.meal_context as GlucoseReading['mealContext'] } as GlucoseReading;
  } else { 
    const { data, error } = await supabase
      .from('glucose_readings')
      .insert(readingToSave)
      .select()
      .single();
    if (error) throw error;
    return { ...data, mealContext: data.meal_context as GlucoseReading['mealContext'] } as GlucoseReading;
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

export async function saveInsulinLog(log: Omit<InsulinLog, 'user_id' | 'created_at'>): Promise<InsulinLog> {
  const userId = await getCurrentUserId();
  const logToSave = {
    ...log, // Includes id if present (for update), type, dose, timestamp
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
    const { data, error } = await supabase
      .from('insulin_logs')
      .insert(logToSave)
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
    .order('created_at', { ascending: false }); // Order by creation time for history

  if (error) throw error;
  return data.map(a => ({
    id: a.id,
    user_id: a.user_id,
    timestamp: a.timestamp, // This is analysis timestamp
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

// For saveMealAnalysis, we expect the AI output and the raw file for upload.
// The 'imageUrl' in the input 'analysis' object (if present) would be a data URI from AI,
// which we will replace with the Supabase Storage URL.
export async function saveMealAnalysis(
  analysis: Omit<MealAnalysis, 'id' | 'imageUrl' | 'user_id' | 'created_at'> & { id?: string; mealPhotoFile?: File }
): Promise<MealAnalysis> {
  const userId = await getCurrentUserId();
  let finalImageUrl: string | undefined = undefined;

  if (analysis.mealPhotoFile) {
    const file = analysis.mealPhotoFile;
    const fileExt = file.name.split('.').pop() || 'jpg'; // Default extension
    const fileName = `${generateId()}.${fileExt}`;
    // Path structure: users/{user_id}/meals/unique_file_name.ext
    const filePath = `users/${userId}/meals/${fileName}`;
    try {
      finalImageUrl = await uploadSupabaseFile('meal-photos', filePath, file);
    } catch (uploadError) {
       console.error("Error uploading meal photo, analysis will be saved without image URL:", uploadError);
       // Continue to save analysis text data even if image upload fails
    }
  }
  
  const analysisDataToSave = {
    user_id: userId,
    timestamp: analysis.timestamp, // Analysis request time
    image_url: finalImageUrl, // Supabase Storage URL or undefined
    original_image_file_name: analysis.originalImageFileName,
    food_identification: analysis.foodIdentification,
    macronutrient_estimates: analysis.macronutrientEstimates,
    estimated_glucose_impact: analysis.estimatedGlucoseImpact,
    suggested_insulin_dose: analysis.suggestedInsulinDose,
    improvement_tips: analysis.improvementTips,
    // created_at will be set by DB
  };
  
  let savedData;
  if (analysis.id) { // Update (not typical for meal analysis, but possible)
    const { data, error } = await supabase
      .from('meal_analyses')
      .update(analysisDataToSave)
      .eq('id', analysis.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    savedData = data;
  } else { // Insert new
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
  
  // Optional: Delete associated image from Supabase Storage
  // To do this, you'd first fetch the mealAnalysis to get its imageUrl, parse the filePath, then delete.
  // For simplicity, this is omitted here but important for a production app.
  // Example:
  // const { data: analysisToDelete, error: fetchError } = await supabase.from('meal_analyses').select('image_url').eq('id', id).eq('user_id', userId).single();
  // if (analysisToDelete && analysisToDelete.image_url) {
  //   const filePath = new URL(analysisToDelete.image_url).pathname.split('/meal-photos/').pop();
  //   if (filePath) await supabase.storage.from('meal-photos').remove([filePath]);
  // }

  const { error } = await supabase
    .from('meal_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
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

export async function saveReminder(reminder: Omit<ReminderConfig, 'user_id' | 'created_at'>): Promise<ReminderConfig> {
  const userId = await getCurrentUserId();
  const reminderToSave = {
    ...reminder, // Includes id if present (for update)
    user_id: userId,
    time: `${reminder.time}:00`, // Ensure HH:MM:SS for DB if 'time' type
    insulin_type: reminder.insulinType || null,
    insulin_dose: reminder.insulinDose || null,
    is_simulated_call: reminder.isSimulatedCall || null,
    simulated_call_contact: reminder.simulatedCallContact || null,
    custom_sound: reminder.customSound || null,
  };

  if (reminder.id) { 
    const { id, ...updateData } = reminderToSave;
    const { data, error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', reminder.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    // Map back to ReminderConfig type
    return { ...reminder, id: data.id, time: data.time.substring(0,5), created_at: data.created_at, user_id: data.user_id };
  } else { 
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminderToSave)
      .select()
      .single();
    if (error) throw error;
    return { ...reminder, id: data.id, time: data.time.substring(0,5), created_at: data.created_at, user_id: data.user_id };
  }
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
