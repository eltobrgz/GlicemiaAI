
'use client';

import InsightsDisplay from '@/components/insights/InsightsDisplay';
import PageHeader from '@/components/PageHeader';

export default function InsightsPage() {

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Insights da IA"
        description="Descubra padrões, tendências e receba dicas personalizadas para otimizar seu controle glicêmico."
      />
      <InsightsDisplay />
    </div>
  );
}
