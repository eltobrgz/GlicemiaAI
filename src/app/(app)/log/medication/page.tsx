
'use client';

import MedicationLogForm from '@/components/medication/MedicationLogForm';
import PageHeader from '@/components/PageHeader';

export default function LogMedicationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Medicamento"
        description="Adicione outros medicamentos que você utiliza para um acompanhamento completo."
      />
      <MedicationLogForm onFormSubmit={() => {}} />
    </div>
  );
}
