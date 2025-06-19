
import type { AnalyzeMealImageOutput as GenAIAnalyzeMealImageOutput } from '@/ai/flows/analyze-meal-image';

export interface GlucoseReading {
  id: string; 
  user_id: string; 
  value: number;
  timestamp: string; 
  mealContext?: 'antes_refeicao' | 'depois_refeicao' | 'jejum' | 'outro' | ''; 
  notes?: string;
  level?: 'baixa' | 'normal' | 'alta' | 'muito_alta';
  created_at: string; 
}

export interface InsulinLog {
  id: string; 
  user_id: string;
  type: string; 
  dose: number; 
  timestamp: string; 
  created_at: string;
}

export type DayOfWeek = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab';

export interface ReminderConfig {
  id: string; 
  user_id: string;
  type: 'glicemia' | 'insulina';
  name: string;
  time: string; 
  days: DayOfWeek[] | 'todos_os_dias'; 
  enabled: boolean;
  insulinType?: string; 
  insulinDose?: number; 
  isSimulatedCall?: boolean; 
  simulatedCallContact?: string; 
  customSound?: string; 
  created_at: string;
}

export type AnalyzeMealImageOutput = GenAIAnalyzeMealImageOutput;

export interface MealAnalysis extends AnalyzeMealImageOutput {
  id: string; 
  user_id: string;
  timestamp: string; 
  imageUrl?: string; // Will be Supabase Storage URL
  originalImageFileName?: string; 
  created_at: string;
}

export interface UserProfile {
  id: string; 
  name: string; 
  email: string; 
  avatarUrl?: string; // Will be Supabase Storage URL
  dateOfBirth?: string; 
  diabetesType?: 'tipo1' | 'tipo2' | 'gestacional' | 'outro'; 
  languagePreference?: string; // Added for language selection, e.g., 'pt-BR', 'en-US'
  created_at?: string;
  updated_at?: string;
}

