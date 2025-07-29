

import type { z } from 'zod';
import type { 
  WeeklyInsightsInputSchema, 
  WeeklyInsightsOutputSchema,
  InterpretedLogSchema,
  AnalyzeMealImageOutputSchema,
  AnalyzeMealImageInputSchema,
} from './schemas';

// export type AnalyzeMealImageOutput = GenAIAnalyzeMealImageOutput;
export type AnalyzeMealImageInput = z.infer<typeof AnalyzeMealImageInputSchema>;
export type AnalyzeMealImageOutput = z.infer<typeof AnalyzeMealImageOutputSchema>;

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

export interface MedicationLog { // Novo tipo
  id: string;
  user_id: string;
  timestamp: string;
  medication_name: string;
  dosage: string;
  notes?: string;
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
  // Metas personalizadas de glicemia
  hypo_glucose_threshold?: number;
  target_glucose_low?: number;
  target_glucose_high?: number;
  hyper_glucose_threshold?: number;
  // Fatores de Cálculo de Bolus
  carb_ratio?: number; // Ratio Carboidrato/Insulina (ex: 15 para 1:15)
  correction_factor?: number; // Fator de Sensibilidade/Correção (ex: 50 para 1U:50mg/dL)
  target_glucose?: number; // Glicemia alvo para cálculos de correção (ex: 100 mg/dL)
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  timestamp: string; // Data e hora do início da atividade
  activity_type: string; // Ex: 'caminhada', 'corrida', 'musculacao', 'ciclismo', 'natacao', 'outro'
  duration_minutes: number; // Duração em minutos
  intensity?: 'leve' | 'moderada' | 'intensa';
  notes?: string;
  created_at: string;
}

export const ACTIVITY_TYPES = [
  { value: 'caminhada', label: 'Caminhada' },
  { value: 'corrida', label: 'Corrida' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'natacao', label: 'Natação' },
  { value: 'danca', label: 'Dança' },
  { value: 'funcional', label: 'Treino Funcional' },
  { value: 'esportes_coletivos', label: 'Esportes Coletivos (Futebol, Basquete, etc.)'},
  { value: 'yoga_pilates', label: 'Yoga / Pilates' },
  { value: 'outro', label: 'Outro' },
];

export const ACTIVITY_INTENSITIES = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'intensa', label: 'Intensa' },
];


// Genkit Flow Types
export type WeeklyInsightsInput = z.infer<typeof WeeklyInsightsInputSchema>;
export type WeeklyInsightsOutput = z.infer<typeof WeeklyInsightsOutputSchema>;
export type InterpretedLog = z.infer<typeof InterpretedLogSchema>;

