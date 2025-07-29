
'use client';

import PageHeader from '@/components/PageHeader';
import ReportGenerator from '@/components/reports/ReportGenerator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Avançados"
        description="Analise suas tendências glicêmicas e de insulina ao longo do tempo."
      />
      <Alert variant="info">
        <FileText className="h-4 w-4" />
        <AlertTitle>Sobre os Relatórios</AlertTitle>
        <AlertDescription>
          Selecione um período para gerar um relatório detalhado com médias, tempo no alvo, variabilidade e mais.
          Use o botão "Exportar para PDF" para criar um documento profissional para compartilhar com sua equipe de saúde.
        </AlertDescription>
      </Alert>
      <ReportGenerator />
    </div>
  );
}
