
import type { GlucoseReading, InsulinLog, ReminderConfig, MealAnalysis, UserProfile } from '@/types';
import { supabase } from './supabaseClient';
import { classifyGlucoseLevel } from './utils'; // generateId might not be needed if DB handles it

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    console.error('Error getting user session or user ID:', error);
    throw new Error('Usuário não autenticado.');
  }
  return session.user.id;
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

    if (error && error.code !== 'PGRST116') { // PGRST116: "Searched item was not found"
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    if (!data) { // If no profile exists, create a default one based on auth user
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            const defaultProfile: UserProfile = {
                id: user.id,
                name: user.user_metadata?.full_name || user.email || 'Novo Usuário',
                email: user.email || '',
                avatarUrl: user.user_metadata?.avatar_url || `https://placehold.co/100x100.png`,
                dateOfBirth: undefined,
                diabetesType: undefined,
            };
            // Attempt to save this default profile. This assumes your RLS allows user to insert their own profile.
            // Or, this could be handled by a DB trigger on auth.users insert.
            await saveUserProfile(defaultProfile); 
            return defaultProfile;
        }
        return null;
    }

    // Map Supabase row (snake_case) to UserProfile (camelCase)
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
    // Return a default mock or null if strictly needed for UI, but ideally handle this upstream
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId !== profile.id) {
    throw new Error("Não é possível salvar o perfil de outro usuário.");
  }

  const profileDataToSave = {
    id: profile.id,
    name: profile.name,
    email: profile.email, // Email updates might require special handling / Supabase config
    avatar_url: profile.avatarUrl,
    date_of_birth: profile.dateOfBirth,
    diabetes_type: profile.diabetesType,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profileDataToSave, { onConflict: 'id' }); // Use upsert for create or update

  if (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
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
    value: r.value,
    timestamp: r.timestamp,
    mealContext: r.meal_context as GlucoseReading['mealContext'] || undefined,
    notes: r.notes || undefined,
    level: r.level as GlucoseReading['level'] || undefined,
  }));
}

export async function saveGlucoseReading(reading: Omit<GlucoseReading, 'id' | 'level'> & { id?: string }): Promise<GlucoseReading> {
  const userId = await getCurrentUserId();
  const level = classifyGlucoseLevel(reading.value);
  
  const readingToSave = {
    user_id: userId,
    value: reading.value,
    timestamp: reading.timestamp,
    meal_context: reading.mealContext || null,
    notes: reading.notes || null,
    level: level,
  };

  if (reading.id) { // Update existing
    const { data, error } = await supabase
      .from('glucose_readings')
      .update(readingToSave)
      .eq('id', reading.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...data, mealContext: data.meal_context as GlucoseReading['mealContext'] };
  } else { // Insert new
    const { data, error } = await supabase
      .from('glucose_readings')
      .insert(readingToSave)
      .select()
      .single();
    if (error) throw error;
    return { ...data, mealContext: data.meal_context as GlucoseReading['mealContext'] };
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
  return data; // Assumes InsulinLog type matches DB structure
}

export async function saveInsulinLog(log: Omit<InsulinLog, 'id'> & { id?: string }): Promise<InsulinLog> {
  const userId = await getCurrentUserId();
  const logToSave = {
    user_id: userId,
    type: log.type,
    dose: log.dose,
    timestamp: log.timestamp,
  };

  if (log.id) { // Update
    const { data, error } = await supabase
      .from('insulin_logs')
      .update(logToSave)
      .eq('id', log.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else { // Insert
    const { data, error } = await supabase
      .from('insulin_logs')
      .insert(logToSave)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    .order('timestamp', { ascending: false });

  if (error) throw error;
  // Map from DB (snake_case) to app type (camelCase)
  return data.map(a => ({
    id: a.id,
    timestamp: a.timestamp,
    imageUrl: a.image_url || undefined,
    originalImageFileName: a.original_image_file_name || undefined,
    foodIdentification: a.food_identification,
    macronutrientEstimates: a.macronutrient_estimates as MealAnalysis['macronutrientEstimates'],
    estimatedGlucoseImpact: a.estimated_glucose_impact,
    suggestedInsulinDose: a.suggested_insulin_dose,
    improvementTips: a.improvement_tips,
  }));
}

export async function saveMealAnalysis(analysis: Omit<MealAnalysis, 'id'> & { id?: string }): Promise<MealAnalysis> {
  const userId = await getCurrentUserId();
  const analysisToSave = {
    user_id: userId,
    timestamp: analysis.timestamp,
    image_url: analysis.imageUrl,
    original_image_file_name: analysis.originalImageFileName,
    food_identification: analysis.foodIdentification,
    macronutrient_estimates: analysis.macronutrientEstimates,
    estimated_glucose_impact: analysis.estimatedGlucoseImpact,
    suggested_insulin_dose: analysis.suggestedInsulinDose,
    improvement_tips: analysis.improvementTips,
  };
  
  if (analysis.id) { // Update
    const { data, error } = await supabase
      .from('meal_analyses')
      .update(analysisToSave)
      .eq('id', analysis.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...analysisToSave, id: data.id, user_id: data.user_id, created_at: data.created_at, ...data } as unknown as MealAnalysis; // Remap after save
  } else { // Insert
    const { data, error } = await supabase
      .from('meal_analyses')
      .insert(analysisToSave)
      .select()
      .single();
    if (error) throw error;
     return { ...analysisToSave, id: data.id, user_id: data.user_id, created_at: data.created_at, ...data } as unknown as MealAnalysis; // Remap after save
  }
}

export async function deleteMealAnalysis(id: string): Promise<void> {
  const userId = await getCurrentUserId();
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
  // Map from DB to app type
  return data.map(r => ({
    id: r.id,
    type: r.type as ReminderConfig['type'],
    name: r.name,
    time: r.time.substring(0,5), // Assuming DB stores HH:MM:SS, take HH:MM
    days: r.days as ReminderConfig['days'],
    enabled: r.enabled,
    insulinType: r.insulin_type || undefined,
    insulinDose: r.insulin_dose || undefined,
    isSimulatedCall: r.is_simulated_call || undefined,
    simulatedCallContact: r.simulated_call_contact || undefined,
    customSound: r.custom_sound || undefined,
  }));
}

export async function saveReminder(reminder: Omit<ReminderConfig, 'id'> & { id?: string }): Promise<ReminderConfig> {
  const userId = await getCurrentUserId();
  // Map from app type to DB
  const reminderToSave = {
    user_id: userId,
    type: reminder.type,
    name: reminder.name,
    time: `${reminder.time}:00`, // Ensure HH:MM:SS for DB if 'time' type
    days: reminder.days,
    enabled: reminder.enabled,
    insulin_type: reminder.insulinType,
    insulin_dose: reminder.insulinDose,
    is_simulated_call: reminder.isSimulatedCall,
    simulated_call_contact: reminder.simulatedCallContact,
    custom_sound: reminder.customSound,
  };

  if (reminder.id) { // Update
    const { data, error } = await supabase
      .from('reminders')
      .update(reminderToSave)
      .eq('id', reminder.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...reminder, id: data.id }; // Return the app type
  } else { // Insert
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminderToSave)
      .select()
      .single();
    if (error) throw error;
    return { ...reminder, id: data.id }; // Return the app type
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

// Remove unused updateGlucoseReading and updateInsulinLog if save handles both insert/update
// export async function updateGlucoseReading(updatedReading: GlucoseReading): Promise<void> {...}
// export async function updateInsulinLog(updatedLog: InsulinLog): Promise<void> {...}
