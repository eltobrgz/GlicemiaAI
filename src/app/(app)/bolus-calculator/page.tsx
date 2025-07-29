

'use client';

import BolusCalculatorForm from '@/components/bolus/BolusCalculatorForm';
import PageHeader from '@/components/PageHeader';

export default function BolusCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculadora de Bolus de Insulina"
        description="Estime a dose de insulina para sua refeição com base nos seus fatores de cálculo pessoais."
      />
      <BolusCalculatorForm />
    </div>
  );
}
