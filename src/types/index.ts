import type { AnalyzeMealImageOutput as GenAIAnalyzeMealImageOutput } from '@/ai/flows/analyze-meal-image';

export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string; // ISO string
  mealContext?: 'antes_refeicao' | 'depois_refeicao' | 'jejum' | 'outro' | '';
  notes?: string;
  level?: 'baixa' | 'normal' | 'alta' | 'muito_alta'; // Determined by thresholds
}

export interface InsulinLog {
  id: string;
  type: string; // e.g., 'Rápida', 'Lenta', 'Mista'
  dose: number; // units
  timestamp: string; // ISO string
}

export type DayOfWeek = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab';

export interface ReminderConfig {
  id: string;
  type: 'glicemia' | 'insulina';
  name: string;
  time: string; // HH:mm
  days: DayOfWeek[] | 'todos_os_dias';
  enabled: boolean;
  // For insulin
  insulinType?: string;
  insulinDose?: number;
  isSimulatedCall?: boolean;
  simulatedCallContact?: string;
  customSound?: string; // Path or identifier for custom sound
}

export type AnalyzeMealImageOutput = GenAIAnalyzeMealImageOutput;

export interface MealAnalysis extends AnalyzeMealImageOutput {
  id: string;
  timestamp: string; // ISO string of when the analysis was done/requested
  imageUrl?: string; // Data URI of the analyzed image (optional, for display)
  originalImageFileName?: string; // Name of the uploaded file
}
