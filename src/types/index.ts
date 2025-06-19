
import type { AnalyzeMealImageOutput as GenAIAnalyzeMealImageOutput } from '@/ai/flows/analyze-meal-image';

export interface GlucoseReading {
  id: string; // Corresponds to Supabase uuid
  user_id?: string; // Foreign key to auth.users.id, managed by backend/storage.ts
  value: number;
  timestamp: string; // ISO string (Supabase timestamp with time zone)
  mealContext?: 'antes_refeicao' | 'depois_refeicao' | 'jejum' | 'outro' | ''; // maps to meal_context
  notes?: string;
  level?: 'baixa' | 'normal' | 'alta' | 'muito_alta';
  created_at?: string; // Supabase timestamp with time zone
}

export interface InsulinLog {
  id: string; // Corresponds to Supabase uuid
  user_id?: string;
  type: string; 
  dose: number; // units
  timestamp: string; // ISO string
  created_at?: string;
}

export type DayOfWeek = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab';

export interface ReminderConfig {
  id: string; // Corresponds to Supabase uuid
  user_id?: string;
  type: 'glicemia' | 'insulina';
  name: string;
  time: string; // HH:mm (app format) -> maps to time in DB (HH:MM:SS)
  days: DayOfWeek[] | 'todos_os_dias'; // maps to jsonb
  enabled: boolean;
  insulinType?: string; // maps to insulin_type
  insulinDose?: number; // maps to insulin_dose
  isSimulatedCall?: boolean; // maps to is_simulated_call
  simulatedCallContact?: string; // maps to simulated_call_contact
  customSound?: string; // maps to custom_sound
  created_at?: string;
}

export type AnalyzeMealImageOutput = GenAIAnalyzeMealImageOutput;

export interface MealAnalysis extends AnalyzeMealImageOutput {
  id: string; // Corresponds to Supabase uuid
  user_id?: string;
  timestamp: string; // ISO string of when the analysis was done/requested
  imageUrl?: string; // Data URI or URL, maps to image_url
  originalImageFileName?: string; // maps to original_image_file_name
  // MacronutrientEstimates, etc., are directly from GenAIAnalyzeMealImageOutput
  // and will be stored in corresponding DB columns (macronutrient_estimates as jsonb)
  created_at?: string;
}

export interface UserProfile {
  id: string; // Corresponds to Supabase uuid (auth.users.id)
  name: string; // maps to name
  email: string; // maps to email
  avatarUrl?: string; // maps to avatar_url
  dateOfBirth?: string; // ISO string YYYY-MM-DD, maps to date_of_birth
  diabetesType?: 'tipo1' | 'tipo2' | 'gestacional' | 'outro'; // maps to diabetes_type
  created_at?: string;
  updated_at?: string;
}
