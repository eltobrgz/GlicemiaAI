'use client';

import GlucoseLogForm from '@/components/glucose/GlucoseLogForm';
import PageHeader from '@/components/PageHeader';

export default function LogGlucosePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Registrar Glicemia Manualmente"
        description="Insira seus níveis de glicose, data, hora e contexto para um acompanhamento preciso."
      />
      <GlucoseLogForm />
    </div>
  );
}
