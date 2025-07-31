
import { Award, BookOpen, Calendar, Camera, Flame, HeartPulse, Shield, Star, Target, TrendingUp, BarChart3, FileText, LucideIcon } from 'lucide-react';
import type { Achievement } from '@/types';


export const GLUCOSE_THRESHOLDS = { // Valores padrão globais
  low: 70, // mg/dL - Abaixo disso é hipoglicemia
  normalIdealMax: 140, // mg/dL - Limite superior da faixa ideal para muitos (ex: pós-prandial)
  high: 180, // mg/dL - Acima disso é considerado hiperglicemia
  // veryHigh: 250, // mg/dL - Este pode ser implícito como > high
};

export const MEAL_CONTEXT_OPTIONS = [
  { value: 'antes_refeicao', label: 'Antes da Refeição' },
  { value: 'depois_refeicao', label: 'Depois da Refeição' },
  { value: 'jejum', label: 'Jejum' },
  { value: 'outro', label: 'Outro' },
];

export const INSULIN_TYPES = [
  'Rápida (Aspart, Lispro, Glulisina)',
  'Curta (Regular/Humana)',
  'Intermediária (NPH)',
  'Lenta (Glargina, Detemir, Degludeca)',
  'Pré-misturada',
  'Outra'
];

export type DayOfWeek = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'Dom', label: 'Domingo' },
  { key: 'Seg', label: 'Segunda' },
  { key: 'Ter', label: 'Terça' },
  { key: 'Qua', label: 'Quarta' },
  { key: 'Qui', label: 'Quinta' },
  { key: 'Sex', label: 'Sexta' },
  { key: 'Sab', label: 'Sábado' },
];

// Constantes para Registro de Atividade
export const ACTIVITY_TYPES_OPTIONS = [
  { value: 'caminhada', label: 'Caminhada' },
  { value: 'corrida', label: 'Corrida' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'natacao', label: 'Natação' },
  { value: 'danca', label: 'Dança' },
  { value: 'funcional', label: 'Treino Funcional' },
  { value: 'esportes_coletivos', label: 'Esportes Coletivos'},
  { value: 'yoga_pilates', label: 'Yoga / Pilates' },
  { value: 'outro', label: 'Outro' },
];

export const ACTIVITY_INTENSITY_OPTIONS = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'intensa', label: 'Intensa' },
];


// Gamification: Definição de todas as conquistas possíveis no sistema
export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  {
    key: 'FIRST_GLUCOSE_LOG',
    name: 'Primeiro Passo',
    description: 'Você registrou sua primeira glicemia! O início de uma jornada de dados.',
    icon: Star,
  },
  {
    key: 'FIRST_MEAL_ANALYSIS',
    name: 'Cientista Culinário',
    description: 'Sua primeira refeição foi analisada pela IA. Conhecimento é poder!',
    icon: Camera,
  },
  {
    key: 'CONSISTENT_LOGGING_STREAK_7_DAYS',
    name: 'Semana Consistente',
    description: 'Você registrou sua glicemia por 7 dias seguidos. Continue assim!',
    icon: Flame,
  },
  {
    key: 'CONSISTENT_LOGGING_STREAK_30_DAYS',
    name: 'Mês de Mestre',
    description: 'Um mês inteiro de registros diários! Sua dedicação é inspiradora.',
    icon: Shield,
  },
  {
    key: 'MEAL_ANALYSIS_MASTER_10',
    name: 'Mestre da Análise',
    description: 'Você analisou 10 refeições com a IA. Você está se tornando um especialista!',
    icon: Award,
  },
   {
    key: 'TIME_IN_TARGET_30_DAYS_70_PERCENT',
    name: 'Rei do Alvo',
    description: 'Você manteve seu tempo no alvo acima de 70% por 30 dias. Incrível!',
    icon: Target,
  },
  {
    key: 'FIRST_REPORT_EXPORTED',
    name: 'Colaborador da Saúde',
    description: 'Você exportou seu primeiro relatório para compartilhar com sua equipe de saúde.',
    icon: FileText,
  },
  {
    key: 'FIRST_INSIGHT_VIEWED',
    name: 'Explorador de Insights',
    description: 'Você visualizou sua primeira análise semanal da IA.',
    icon: BarChart3,
  },
   {
    key: 'ACTIVITY_LOG_10',
    name: 'Atleta Ativo',
    description: 'Registrou 10 atividades físicas. Mantenha o corpo em movimento!',
    icon: HeartPulse,
  },
];
