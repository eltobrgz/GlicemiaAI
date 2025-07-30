
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { interpretVoiceLog } from '@/ai/flows/interpret-voice-log';

import GlucoseLogForm from '@/components/glucose/GlucoseLogForm';
import InsulinLogForm from '@/components/insulin/InsulinLogForm';
import MedicationLogForm from '@/components/medication/MedicationLogForm';
import ActivityLogForm from '@/components/activity/ActivityLogForm';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type VoiceAssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'error';

interface VoiceLogDialogProps {
  onFormSubmit: () => void;
  initialData?: any; // Not used, but part of the standard dialog props
}

export default function VoiceLogDialog({ onFormSubmit }: VoiceLogDialogProps) {
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>('idle');
  const [confirmationData, setConfirmationData] = useState<any | null>(null);
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: recognitionError,
    hasRecognitionSupport
  } = useSpeechRecognition();
  const { toast } = useToast();
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!isListening && assistantState === 'listening' && finalTranscriptRef.current.trim()) {
      handleProcessTranscript(finalTranscriptRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, assistantState]);

  useEffect(() => {
    if (isListening) {
      setAssistantState('listening');
      finalTranscriptRef.current = transcript;
    }
  }, [isListening, transcript]);

  useEffect(() => {
    if (recognitionError) {
      setAssistantState('error');
    }
  }, [recognitionError]);

  const resetState = () => {
    setAssistantState('idle');
    setConfirmationData(null);
    finalTranscriptRef.current = '';
  };

  const handleProcessTranscript = async (text: string) => {
    if (!text.trim()) {
      setAssistantState('idle');
      return;
    }
    setAssistantState('processing');
    try {
      const result = await interpretVoiceLog({ input: text });

      if (result.logType === 'unrecognized') {
        toast({
          title: "Não entendi, pode tentar de novo?",
          description: result.reason || "Não foi possível identificar o que você quis registrar.",
          variant: 'destructive',
        });
        resetState();
      } else {
        setConfirmationData(result);
        setAssistantState('confirming');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar o comando",
        description: error.message || 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      });
      setAssistantState('error');
    }
  };

  const handleConfirmationSuccess = () => {
    toast({
      title: 'Registro Salvo!',
      description: 'Seu registro de voz foi salvo com sucesso.',
    });
    onFormSubmit(); // This will close the dialog via context
    resetState();
  };

  if (hasRecognitionSupport === null) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando compatibilidade...</p>
        </div>
      )
  }

  if (hasRecognitionSupport === false) {
     return (
        <Alert variant="destructive">
            <AlertTitle>Funcionalidade Indisponível</AlertTitle>
            <AlertDescription>
                O reconhecimento de voz não é suportado pelo seu navegador. Por favor, tente usar o Google Chrome para uma melhor compatibilidade.
            </AlertDescription>
        </Alert>
     )
  }

  const renderConfirmationForm = () => {
    if (!confirmationData) return null;

    const commonProps = {
      onFormSubmit: handleConfirmationSuccess,
    };
    
    // Pass the entire confirmationData object as initialData
    const initialDataForForm = confirmationData;

    switch (confirmationData.logType) {
      case 'glucose':
        return <GlucoseLogForm {...commonProps} initialData={initialDataForForm} />;
      case 'insulin':
        return <InsulinLogForm {...commonProps} initialData={initialDataForForm} />;
      case 'medication':
        return <MedicationLogForm {...commonProps} initialData={initialDataForForm} />;
      case 'activity':
        return <ActivityLogForm {...commonProps} initialData={initialDataForForm} />;
      default:
        // This case should ideally not be reached if the AI is working correctly.
        toast({
            title: "Tipo de Log Desconhecido",
            description: `A IA retornou um tipo de log inesperado: ${confirmationData.logType}`,
            variant: "destructive",
        });
        resetState();
        return <p>Tipo de log desconhecido: {confirmationData.logType}</p>;
    }
  };

  return (
    <div className="flex flex-col">
        <DialogDescription>
            {assistantState === 'idle' && "Pressione o microfone e fale o que deseja registrar."}
            {assistantState === 'listening' && "Estou ouvindo... Pressione o microfone novamente para parar."}
            {assistantState === 'processing' && "Processando sua solicitação..."}
            {assistantState === 'confirming' && "Por favor, confirme se os dados abaixo estão corretos."}
            {assistantState === 'error' && "Ocorreu um erro. Tente novamente."}
        </DialogDescription>

        {assistantState !== 'confirming' && (
            <div className="my-8 flex flex-col items-center justify-center gap-4">
                <Button
                    size="icon"
                    className={`h-24 w-24 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-primary hover:bg-primary/90'}`}
                    onClick={() => {
                        if (isListening) {
                            finalTranscriptRef.current = transcript;
                            stopListening();
                        } else {
                            startListening();
                        }
                    }}
                    disabled={assistantState === 'processing'}
                >
                    {assistantState === 'processing'
                        ? <Loader2 className="h-10 w-10 animate-spin" />
                        : isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />
                    }
                </Button>
                <p className="min-h-[40px] text-center text-muted-foreground italic">
                    {transcript ? `"${transcript}"` : "Ex: 'Minha glicemia agora é 120'"}
                </p>
            </div>
        )}

        {assistantState === 'confirming' && (
            <div className="mt-4">
                <Alert variant="info" className="mb-4">
                    <AlertTitle>Confirme os Dados</AlertTitle>
                    <AlertDescription>Verifique se a IA interpretou seu comando corretamente. Você pode editar os campos antes de salvar.</AlertDescription>
                </Alert>
                {renderConfirmationForm()}
            </div>
        )}

        {assistantState === 'error' && (
            <div className="my-8 flex flex-col items-center">
                <p className="text-destructive mb-4">{recognitionError || "Ocorreu um erro desconhecido."}</p>
                <Button variant="outline" onClick={resetState}>Tentar Novamente</Button>
            </div>
        )}

        {assistantState !== 'confirming' && (
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Fechar</Button>
                </DialogClose>
            </DialogFooter>
        )}
    </div>
  );
}
