'use client';

import InsulinLogForm from '@/components/insulin/InsulinLogForm';
import PageHeader from '@/components/PageHeader';

export default function LogInsulinPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Registrar Administração de Insulina"
        description="Mantenha um histórico preciso das suas doses de insulina."
      />
      <InsulinLogForm />
    </div>
  );
}
