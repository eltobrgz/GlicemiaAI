
// src/types/supabase.ts

// These type definitions are based on the assumed Supabase table structures.
// You'll need to create these tables and RLS policies in your Supabase project.
// See SQL comments in src/lib/supabaseClient.ts for table creation guidance.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // uuid, primary key, foreign key to auth.users.id
          name: string | null
          email: string | null // Can be synced from auth.users.email
          avatar_url: string | null
          date_of_birth: string | null // ISO date string YYYY-MM-DD
          diabetes_type: string | null // 'tipo1', 'tipo2', 'gestacional', 'outro'
          language_preference: string | null // e.g., 'pt-BR', 'en-US'
          // Metas personalizadas de glicemia
          hypo_glucose_threshold: number | null
          target_glucose_low: number | null
          target_glucose_high: number | null
          hyper_glucose_threshold: number | null
          created_at: string // timestamp with time zone
          updated_at: string // timestamp with time zone
        }
        Insert: {
          id: string // Should match auth.users.id
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          diabetes_type?: string | null
          language_preference?: string | null
          hypo_glucose_threshold?: number | null
          target_glucose_low?: number | null
          target_glucose_high?: number | null
          hyper_glucose_threshold?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          diabetes_type?: string | null
          language_preference?: string | null
          hypo_glucose_threshold?: number | null
          target_glucose_low?: number | null
          target_glucose_high?: number | null
          hyper_glucose_threshold?: number | null
          updated_at?: string
        }
      }
      glucose_readings: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          value: number
          timestamp: string // timestamp with time zone
          meal_context: string | null // 'antes_refeicao', 'depois_refeicao', 'jejum', 'outro'
          notes: string | null
          level: string | null // 'baixa', 'normal', 'alta', 'muito_alta'
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid, defaults to uuid_generate_v4() in DB
          user_id: string
          value: number
          timestamp: string
          meal_context?: string | null
          notes?: string | null
          level?: string | null
          created_at?: string
        }
        Update: {
          value?: number
          timestamp?: string
          meal_context?: string | null
          notes?: string | null
          level?: string | null
        }
      }
      insulin_logs: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          type: string
          dose: number
          timestamp: string // timestamp with time zone
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid
          user_id: string
          type: string
          dose: number
          timestamp: string
          created_at?: string
        }
        Update: {
          type?: string
          dose?: number
          timestamp?: string
        }
      }
      meal_analyses: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          timestamp: string // timestamp with time zone
          image_url: string | null
          original_image_file_name: string | null
          food_identification: string
          macronutrient_estimates: Json // { "carbohydrates": number, "protein": number, "fat": number }
          estimated_glucose_impact: string
          suggested_insulin_dose: string
          improvement_tips: string
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid
          user_id: string
          timestamp: string
          image_url?: string | null
          original_image_file_name?: string | null
          food_identification: string
          macronutrient_estimates: Json
          estimated_glucose_impact: string
          suggested_insulin_dose: string
          improvement_tips: string
          created_at?: string
        }
        Update: {
          timestamp?: string
          image_url?: string | null
          original_image_file_name?: string | null
          food_identification?: string
          macronutrient_estimates?: Json
          estimated_glucose_impact?: string
          suggested_insulin_dose?: string
          improvement_tips?: string
        }
      }
      reminders: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          type: string // 'glicemia' or 'insulina'
          name: string
          time: string // time without time zone (HH:MM:SS)
          days: Json // string[] or 'todos_os_dias'
          enabled: boolean
          insulin_type: string | null
          insulin_dose: number | null
          is_simulated_call: boolean | null
          simulated_call_contact: string | null
          custom_sound: string | null
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid
          user_id: string
          type: string
          name: string
          time: string
          days: Json
          enabled?: boolean
          insulin_type?: string | null
          insulin_dose?: number | null
          is_simulated_call?: boolean | null
          simulated_call_contact?: string | null
          custom_sound?: string | null
          created_at?: string
        }
        Update: {
          type?: string
          name?: string
          time?: string
          days?: Json
          enabled?: boolean
          insulin_type?: string | null
          insulin_dose?: number | null
          is_simulated_call?: boolean | null
          simulated_call_contact?: string | null
          custom_sound?: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          timestamp: string // timestamp with time zone, data e hora do início
          activity_type: string
          duration_minutes: number
          intensity: string | null // 'leve', 'moderada', 'intensa'
          notes: string | null
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid
          user_id: string
          timestamp: string
          activity_type: string
          duration_minutes: number
          intensity?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          timestamp?: string
          activity_type?: string
          duration_minutes?: number
          intensity?: string | null
          notes?: string | null
        }
      }
      medication_logs: { // Nova tabela
        Row: {
          id: string // uuid, primary key
          user_id: string // uuid, foreign key to auth.users.id
          timestamp: string // timestamp with time zone
          medication_name: string
          dosage: string // Usar string para flexibilidade (e.g., "500mg", "1 comprimido")
          notes: string | null
          created_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // uuid
          user_id: string
          timestamp: string
          medication_name: string
          dosage: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          timestamp?: string
          medication_name?: string
          dosage?: string
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
