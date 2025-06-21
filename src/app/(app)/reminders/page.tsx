
'use client';

import ReminderSetup from '@/components/reminders/ReminderSetup';
import PageHeader from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BellRing, Info } from "lucide-react"


export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gerenciamento de Lembretes"
        description="Configure e personalize lembretes para medições de glicemia e administração de insulina."
      />
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Como os Lembretes Funcionam</AlertTitle>
        <AlertDescription>
          Os lembretes funcionam através de Notificações do Navegador. Para que você receba os alertas, <strong>a aba do GlicemiaAI deve permanecer aberta em seu navegador</strong>.
          <br />
          Se você fechar a aba, as notificações não serão enviadas. A funcionalidade de "chamada simulada" apenas altera o texto da notificação para torná-la mais visível, não realizando uma chamada real.
        </AlertDescription>
      </Alert>
      <ReminderSetup />
    </div>
  );
}

    
