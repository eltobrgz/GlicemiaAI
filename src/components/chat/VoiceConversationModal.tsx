
'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, X } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { conversationalAgent } from '@/ai/flows/conversational-agent';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { getAllUserDataForAI } from '@/lib/storage';
import { cn } from '@/lib/utils';

type ConversationState = 'idle' | 'listening' | 'processing_speech' | 'thinking' | 'speaking' | 'error';

const stateDescriptions: Record<ConversationState, string> = {
    idle: 'Pressione o microfone para começar a falar.',
    listening: 'Ouvindo atentamente...',
    processing_speech: 'Processando sua fala...',
    thinking: 'Aguarde, estou pensando em uma resposta...',
    speaking: 'Falando...',
    error: 'Ocorreu um erro. Por favor, tente novamente.'
};

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceConversationModal({ isOpen, onClose }: VoiceConversationModalProps) {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeUpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationHistoryRef = useRef<any[]>([]); // To maintain context

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: recognitionError,
    resetTranscript,
  } = useSpeechRecognition();

  const handleClose = () => {
    if (wakeUpTimeoutRef.current) clearTimeout(wakeUpTimeoutRef.current);
    if (isListening) stopListening();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setConversationState('idle');
    conversationHistoryRef.current = [];
    onClose();
  };

  const processUserSpeech = async (userText: string) => {
    if (!userText.trim()) {
      setConversationState('idle');
      return;
    }

    setConversationState('thinking');
    
    // Add user message to history
    conversationHistoryRef.current.push({ role: 'user', content: [{ text: userText }] });

    try {
      const userData = await getAllUserDataForAI();
      const responseText = await conversationalAgent({
        history: conversationHistoryRef.current,
        userData: userData,
      });

      // Add model response to history
      conversationHistoryRef.current.push({ role: 'model', content: [{ text: responseText }] });

      const ttsResponse = await textToSpeech(responseText);
      
      setConversationState('speaking');
      if (audioRef.current) {
        audioRef.current.src = ttsResponse.audioDataUri;
        audioRef.current.play();
      }

    } catch (error: any) {
      console.error("Voice conversation error:", error);
      toast({ title: "Erro na Conversa", description: error.message, variant: "destructive" });
      setConversationState('error');
    }
  };
  
  // Effect to handle initial modal opening
  useEffect(() => {
    if (isOpen) {
      // Create audio element on mount if it doesn't exist
      if (!audioRef.current) {
          const audio = new Audio();
          audio.onended = () => {
            // After speaking, wait a bit then start listening again
            wakeUpTimeoutRef.current = setTimeout(() => {
              startListening();
            }, 750);
          };
          audioRef.current = audio;
      }
      
      // Auto-start listening when modal opens
      wakeUpTimeoutRef.current = setTimeout(() => {
        startListening();
      }, 500);
    }

    return () => {
      if (wakeUpTimeoutRef.current) {
        clearTimeout(wakeUpTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Effect to update conversation state based on speech recognition state
  useEffect(() => {
    if(isOpen) {
        if (isListening) {
          setConversationState('listening');
        } else if (conversationState === 'listening') {
          // This transition happens when speech recognition stops automatically
          setConversationState('processing_speech');
          processUserSpeech(transcript);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isOpen, conversationState]);

  // Handle errors from speech recognition
  useEffect(() => {
    if (recognitionError) {
      toast({ title: 'Erro de Reconhecimento de Voz', description: recognitionError, variant: 'destructive' });
      setConversationState('error');
    }
  }, [recognitionError, toast]);

  const handleMicButtonClick = () => {
    if (isListening) {
      stopListening(); // This will trigger the processing flow
    } else {
      startListening();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-md bg-background/95 backdrop-blur-sm" 
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
        >
        <div className="flex flex-col items-center justify-center text-center py-8 min-h-[300px]">
          <DialogTitle className="text-2xl font-bold text-primary mb-2">
            Modo de Conversa
          </DialogTitle>
          <DialogDescription className="mb-8 min-h-[40px]">
            {stateDescriptions[conversationState]}
            {conversationState === 'listening' && (
                <p className="text-sm text-muted-foreground italic mt-2">"{transcript}"</p>
            )}
          </DialogDescription>

          <div className="relative h-32 w-32 flex items-center justify-center">
            {conversationState === 'speaking' && (
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
            )}
            <Button
                size="icon"
                className={cn(
                    "h-24 w-24 rounded-full transition-all duration-300 shadow-xl",
                    conversationState === 'listening' && 'bg-destructive hover:bg-destructive/90 scale-110',
                    conversationState !== 'listening' && 'bg-primary hover:bg-primary/90'
                )}
                onClick={handleMicButtonClick}
                disabled={conversationState !== 'idle' && conversationState !== 'listening' && conversationState !== 'error'}
            >
                {conversationState === 'thinking' || conversationState === 'processing_speech' ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                    <Mic className="h-10 w-10" />
                )}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="absolute bottom-4 right-4">
            <Button type="button" variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-6 w-6" />
                <span className="sr-only">Fechar</span>
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    