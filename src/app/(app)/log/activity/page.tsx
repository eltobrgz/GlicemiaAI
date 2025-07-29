
'use client';

import ActivityLogForm from '@/components/activity/ActivityLogForm';
import PageHeader from '@/components/PageHeader';

export default function LogActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Atividade Física"
        description="Adicione seus exercícios para um acompanhamento mais completo do seu bem-estar."
      />
      <ActivityLogForm onFormSubmit={() => {}} />
    </div>
  );
}
