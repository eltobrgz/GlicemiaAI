
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { interpretVoiceLog } from '@/ai/flows/interpret-voice-log';
import type { InterpretedLog } from '@/types';

import GlucoseLogForm from '@/components/glucose/GlucoseLogForm';
import InsulinLogForm from '@/components/insulin/InsulinLogForm';
import MedicationLogForm from '@/components/medication/MedicationLogForm';
import ActivityLogForm from '@/components/activity/ActivityLogForm';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type VoiceAssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'error';

const VOICE_ASSISTANT_POSITION_KEY = 'glicemiaai-voice-assistant-position';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>('idle');
  const [confirmationData, setConfirmationData] = useState<InterpretedLog | null>(null);
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: recognitionError,
    hasRecognitionSupport
  } = useSpeechRecognition();
  const { toast } = useToast();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  useEffect(() => {
    const setInitialPosition = () => {
      try {
        const savedPosition = localStorage.getItem(VOICE_ASSISTANT_POSITION_KEY);
        if (savedPosition) {
          const parsedPosition = JSON.parse(savedPosition);
          setPosition(parsedPosition);
        } else {
          const buttonWidth = 40; // w-10
          const buttonHeight = 40; // h-10
          const marginX = window.innerWidth > 768 ? 40 : 24;
          const marginY = window.innerHeight > 768 ? 40 : 24;
          setPosition({
            x: window.innerWidth - buttonWidth - marginX,
            y: window.innerHeight - buttonHeight - marginY - 80, // Adjust for bottom nav bar
          });
        }
      } catch (error) {
        console.error("Failed to parse saved position, using default.", error);
        const buttonWidth = 40;
        const buttonHeight = 40;
        const marginX = window.innerWidth > 768 ? 40 : 24;
        const marginY = window.innerHeight > 768 ? 40 : 24;
        setPosition({
          x: window.innerWidth - buttonWidth - marginX,
          y: window.innerHeight - buttonHeight - marginY - 80,
        });
      }
    };
    setInitialPosition();

    const handleResize = () => {
      if (buttonRef.current) {
        const buttonWidth = buttonRef.current.offsetWidth;
        const buttonHeight = buttonRef.current.offsetHeight;
        setPosition(currentPos => ({
          x: Math.max(0, Math.min(currentPos.x, window.innerWidth - buttonWidth)),
          y: Math.max(0, Math.min(currentPos.y, window.innerHeight - buttonHeight))
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isListening) {
      setAssistantState('listening');
    } else if (assistantState === 'listening') {
      if (transcript.trim()) {
        handleProcessTranscript(transcript);
      } else {
        setAssistantState('idle');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);
  
  useEffect(() => {
    if (recognitionError) {
      setAssistantState('error');
    }
  }, [recognitionError]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      setWasDragged(false);
      setIsDragging(true);
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      buttonRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDragging && buttonRef.current) {
      if (!wasDragged) setWasDragged(true);
      
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      const buttonWidth = buttonRef.current.offsetWidth;
      const buttonHeight = buttonRef.current.offsetHeight;
      newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      setIsDragging(false);
      buttonRef.current.releasePointerCapture(e.pointerId);
      if (wasDragged) {
        localStorage.setItem(VOICE_ASSISTANT_POSITION_KEY, JSON.stringify(position));
      }
    }
  };

  const handleButtonClick = () => {
    if (wasDragged) {
      return;
    }
    if (!hasRecognitionSupport) {
      toast({
        title: "Funcionalidade Indisponível",
        description: "O reconhecimento de voz não é suportado pelo seu navegador.",
        variant: 'destructive'
      });
      return;
    }
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isListening) {
        stopListening();
      }
      resetState();
    }
    setIsOpen(open);
  };
  
  const resetState = () => {
    setAssistantState('idle');
    setConfirmationData(null);
  };

  const handleProcessTranscript = async (text: string) => {
    setAssistantState('processing');
    try {
      const result = await interpretVoiceLog(text);
      if (result.logType === 'unrecognized') {
        toast({
          title: "Não entendi, pode tentar de novo?",
          description: result.data.reason,
          variant: 'destructive',
        });
        setAssistantState('idle');
      } else {
        setConfirmationData(result);
        setAssistantState('confirming');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar o comando",
        description: error.message,
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
    setIsOpen(false);
    resetState();
  };

  const renderConfirmationForm = () => {
    if (!confirmationData) return null;

    const commonProps = {
        onFormSubmit: handleConfirmationSuccess,
    };

    switch (confirmationData.logType) {
        case 'glucose':
            return <GlucoseLogForm {...commonProps} initialData={{...confirmationData.data}} />;
        case 'insulin':
            return <InsulinLogForm {...commonProps} initialData={{...confirmationData.data}} />;
        case 'medication':
            return <MedicationLogForm {...commonProps} initialData={{...confirmationData.data}} />;
        case 'activity':
            return <ActivityLogForm {...commonProps} initialData={{...confirmationData.data}} />;
        default:
            return <p>Tipo de log desconhecido.</p>;
    }
  };

  return (
    <>
      <Button
        ref={buttonRef}
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          touchAction: 'none'
        }}
        className="z-50 h-12 w-12 rounded-full shadow-2xl cursor-grab active:cursor-grabbing"
        size="icon"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleButtonClick}
        aria-label="Assistente de Voz"
        title="Assistente de Voz (clique para abrir, arraste para mover)"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary font-headline">Assistente de Voz</DialogTitle>
             <DialogDescription>
                {assistantState === 'idle' && "Pressione o microfone e fale o que deseja registrar."}
                {assistantState === 'listening' && "Estou ouvindo... Pressione o microfone novamente para parar."}
                {assistantState === 'processing' && "Processando sua solicitação..."}
                {assistantState === 'confirming' && "Por favor, confirme se os dados abaixo estão corretos."}
                {assistantState === 'error' && "Ocorreu um erro. Tente novamente."}
            </DialogDescription>
          </DialogHeader>

          {assistantState !== 'confirming' && (
             <div className="my-8 flex flex-col items-center justify-center gap-4">
                <Button
                    size="icon"
                    className={`h-24 w-24 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-primary hover:bg-primary/90'}`}
                    onClick={isListening ? stopListening : startListening}
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
          
          <DialogFooter>
             {assistantState !== 'confirming' && (
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Fechar</Button>
                </DialogClose>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
