'use client';

import ReminderSetup from '@/components/reminders/ReminderSetup';
import PageHeader from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"


export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gerenciamento de Lembretes"
        description="Configure e personalize lembretes para medições de glicemia e administração de insulina."
      />
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Funcionalidade de Lembrete</AlertTitle>
        <AlertDescription>
          Os lembretes configurados aqui são para fins de demonstração da interface. A funcionalidade de notificação real (especialmente em segundo plano ou com o aplicativo fechado) requer integrações mais complexas (como Push Notifications) que não estão no escopo deste exemplo.
        </AlertDescription>
      </Alert>
      <ReminderSetup />
    </div>
  );
}
