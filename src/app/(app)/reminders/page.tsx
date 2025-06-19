
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
        {/* Icone será adicionado automaticamente pelo componente Alert */}
        <AlertTitle>Notificações de Lembretes no Navegador</AlertTitle>
        <AlertDescription>
          Os lembretes configurados aqui usarão as Notificações do Navegador para alertá-lo.
          Para que funcionem, você precisará conceder permissão para notificações quando solicitado.
          As notificações são mais eficazes quando a aba do GlicemiaAI está aberta no seu navegador.
          Para uma experiência de notificação mais robusta (mesmo com o app fechado), seria necessária uma configuração de notificações push, que é mais complexa.
        </AlertDescription>
      </Alert>
      <ReminderSetup />
    </div>
  );
}

    
