'use client';

import GlucoseHistoryCalendar from '@/components/glucose/GlucoseHistoryCalendar';
import PageHeader from '@/components/PageHeader';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Calendário de Acompanhamento Glicêmico"
        description="Visualize suas medições diárias, identifique padrões e acompanhe seu progresso ao longo do tempo."
      />
      <GlucoseHistoryCalendar />
    </div>
  );
}
