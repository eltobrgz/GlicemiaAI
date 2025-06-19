export const GLUCOSE_THRESHOLDS = {
  low: 70, // mg/dL
  normalIdealMax: 140, // mg/dL (e.g. post-meal for non-diabetic, or general target)
  high: 180, // mg/dL
  veryHigh: 250, // mg/dL
};

export const MEAL_CONTEXT_OPTIONS = [
  { value: '', label: 'Selecionar contexto' },
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

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'Dom', label: 'Domingo' },
  { key: 'Seg', label: 'Segunda' },
  { key: 'Ter', label: 'Terça' },
  { key: 'Qua', label: 'Quarta' },
  { key: 'Qui', label: 'Quinta' },
  { key: 'Sex', label: 'Sexta' },
  { key: 'Sab', label: 'Sábado' },
];
