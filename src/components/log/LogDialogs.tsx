
'use client';

import { useLogDialog } from '@/contexts/LogDialogsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GlucoseLogForm from '@/components/glucose/GlucoseLogForm';
import InsulinLogForm from '@/components/insulin/InsulinLogForm';
import ActivityLogForm from '@/components/activity/ActivityLogForm';
import MedicationLogForm from '@/components/medication/MedicationLogForm';
import VoiceLogDialog from '@/components/voice/VoiceLogDialog';
import { Droplet, Pill, Bike, ClipboardPlus, Mic } from 'lucide-react';

const dialogConfig = {
  glucose: {
    title: 'Registrar Glicemia',
    Icon: Droplet,
    Form: GlucoseLogForm,
  },
  insulin: {
    title: 'Registrar Insulina',
    Icon: Pill,
    Form: InsulinLogForm,
  },
  activity: {
    title: 'Registrar Atividade Física',
    Icon: Bike,
    Form: ActivityLogForm,
  },
  medication: {
    title: 'Registrar Medicamento',
    Icon: ClipboardPlus,
    Form: MedicationLogForm,
  },
  voice: {
    title: 'Assistente de Voz',
    Icon: Mic,
    Form: VoiceLogDialog,
  },
};

export function LogDialogs() {
  const { openLog, closeDialog, initialData, notifySuccess } = useLogDialog();

  if (!openLog) {
    return null;
  }

  const { title, Icon, Form } = dialogConfig[openLog];
  const currentInitialData = initialData[openLog];
  const dialogTitle = 
    openLog === 'voice' 
      ? title 
      : `${currentInitialData?.id ? 'Editar' : 'Registrar'} ${title.replace('Registrar ', '')}`;

  return (
    <Dialog open={!!openLog} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-headline text-primary">
            <Icon className="mr-2 h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <Form onFormSubmit={() => notifySuccess(openLog)} initialData={currentInitialData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
