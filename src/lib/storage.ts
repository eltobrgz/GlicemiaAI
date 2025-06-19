
import type { GlucoseReading, InsulinLog, ReminderConfig, MealAnalysis, UserProfile } from '@/types';

const GLUCOSE_READINGS_KEY = 'glicemiaAI_glucoseReadings';
const INSULIN_LOGS_KEY = 'glicemiaAI_insulinLogs';
const REMINDERS_KEY = 'glicemiaAI_reminders';
const MEAL_ANALYSES_KEY = 'glicemiaAI_mealAnalyses';
const USER_PROFILE_KEY = 'glicemiaAI_userProfile';


function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON from localStorage:", error);
    return defaultValue;
  }
}

// Glucose Readings
export function getGlucoseReadings(): GlucoseReading[] {
  if (typeof window === 'undefined') return [];
  const data = window.localStorage.getItem(GLUCOSE_READINGS_KEY);
  return safelyParseJSON<GlucoseReading[]>(data, []);
}

export function saveGlucoseReading(reading: GlucoseReading): void {
  if (typeof window === 'undefined') return;
  const readings = getGlucoseReadings();
  // Check if reading already exists to prevent duplicates if ID is stable before save
  const existingIndex = readings.findIndex(r => r.id === reading.id);
  if (existingIndex > -1) {
    readings[existingIndex] = reading; // Update existing
  } else {
    readings.unshift(reading); // Add new to the beginning
  }
  window.localStorage.setItem(GLUCOSE_READINGS_KEY, JSON.stringify(readings));
}

export function updateGlucoseReading(updatedReading: GlucoseReading): void {
  if (typeof window === 'undefined') return;
  let readings = getGlucoseReadings();
  readings = readings.map(r => r.id === updatedReading.id ? updatedReading : r);
  window.localStorage.setItem(GLUCOSE_READINGS_KEY, JSON.stringify(readings));
}

export function deleteGlucoseReading(id: string): void {
  if (typeof window === 'undefined') return;
  let readings = getGlucoseReadings();
  readings = readings.filter(r => r.id !== id);
  window.localStorage.setItem(GLUCOSE_READINGS_KEY, JSON.stringify(readings));
}


// Insulin Logs
export function getInsulinLogs(): InsulinLog[] {
  if (typeof window === 'undefined') return [];
  const data = window.localStorage.getItem(INSULIN_LOGS_KEY);
  return safelyParseJSON<InsulinLog[]>(data, []);
}

export function saveInsulinLog(log: InsulinLog): void {
  if (typeof window === 'undefined') return;
  const logs = getInsulinLogs();
   const existingIndex = logs.findIndex(l => l.id === log.id);
  if (existingIndex > -1) {
    logs[existingIndex] = log;
  } else {
    logs.unshift(log);
  }
  window.localStorage.setItem(INSULIN_LOGS_KEY, JSON.stringify(logs));
}

export function updateInsulinLog(updatedLog: InsulinLog): void {
  if (typeof window === 'undefined') return;
  let logs = getInsulinLogs();
  logs = logs.map(l => l.id === updatedLog.id ? updatedLog : l);
  window.localStorage.setItem(INSULIN_LOGS_KEY, JSON.stringify(logs));
}

export function deleteInsulinLog(id: string): void {
  if (typeof window === 'undefined') return;
  let logs = getInsulinLogs();
  logs = logs.filter(l => l.id !== id);
  window.localStorage.setItem(INSULIN_LOGS_KEY, JSON.stringify(logs));
}


// Reminders
export function getReminders(): ReminderConfig[] {
  if (typeof window === 'undefined') return [];
  const data = window.localStorage.getItem(REMINDERS_KEY);
  return safelyParseJSON<ReminderConfig[]>(data, []);
}

export function saveReminder(reminder: ReminderConfig): void {
  if (typeof window === 'undefined') return;
  const reminders = getReminders();
  const existingIndex = reminders.findIndex(r => r.id === reminder.id);
  if (existingIndex > -1) {
    reminders[existingIndex] = reminder;
  } else {
    reminders.push(reminder);
  }
  window.localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function deleteReminder(id: string): void {
  if (typeof window === 'undefined') return;
  let reminders = getReminders();
  reminders = reminders.filter(r => r.id !== id);
  window.localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Meal Analyses
export function getMealAnalyses(): MealAnalysis[] {
  if (typeof window === 'undefined') return [];
  const data = window.localStorage.getItem(MEAL_ANALYSES_KEY);
  return safelyParseJSON<MealAnalysis[]>(data, []);
}

export function saveMealAnalysis(analysis: MealAnalysis): void {
  if (typeof window === 'undefined') return;
  const analyses = getMealAnalyses();
  const existingIndex = analyses.findIndex(a => a.id === analysis.id);
  if (existingIndex > -1) {
    analyses[existingIndex] = analysis;
  } else {
    analyses.unshift(analysis);
  }
  window.localStorage.setItem(MEAL_ANALYSES_KEY, JSON.stringify(analyses));
}

export function deleteMealAnalysis(id: string): void {
  if (typeof window === 'undefined') return;
  let analyses = getMealAnalyses();
  analyses = analyses.filter(a => a.id !== id);
  window.localStorage.setItem(MEAL_ANALYSES_KEY, JSON.stringify(analyses));
}

// User Profile
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const data = window.localStorage.getItem(USER_PROFILE_KEY);
  let profile = safelyParseJSON<UserProfile | null>(data, null);
  
  // Return a default mock profile if none is found or if critical fields are missing
  if (!profile || !profile.id || !profile.name || !profile.email) {
    profile = {
      id: 'default-user-01',
      name: 'Usuário GlicemiaAI',
      email: 'usuario@glicemia.ai',
      avatarUrl: 'https://placehold.co/100x100.png',
      dateOfBirth: '1990-01-01', // YYYY-MM-DD
      diabetesType: 'tipo1',
    };
    // Optionally save this default profile back to localStorage if it was missing/corrupted
    // saveUserProfile(profile); 
  }
  return profile;
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}
