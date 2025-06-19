
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
