
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
      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <BellRing className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Notificações de Lembretes</AlertTitle>
        <AlertDescription className="text-primary/80">
          Os lembretes configurados aqui usarão as Notificações do Navegador para alertá-lo.
          Certifique-se de que concedeu permissão para notificações nas configurações desta página.
          As notificações só funcionarão se a aba do GlicemiaAI estiver aberta no seu navegador.
          Para uma experiência de notificação mais robusta (mesmo com o app fechado), seria necessária uma configuração mais avançada com notificações push.
        </AlertDescription>
      </Alert>
      <ReminderSetup />
    </div>
  );
}

    