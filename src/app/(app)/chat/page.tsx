
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, Bot, User, Info, Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { conversationalAgent } from '@/ai/flows/conversational-agent';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getAllUserDataForAI } from '@/lib/storage';

interface Message {
  id: string;
  role: 'user' | 'model' | 'welcome';
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', role: 'welcome', text: 'Welcome Message' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition();

  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (isListening) {
      setInput(transcript);
      finalTranscriptRef.current = transcript;
    }
  }, [transcript, isListening]);
  
  useEffect(() => {
    // When listening stops, process the final transcript.
    if (!isListening && finalTranscriptRef.current.trim()) {
      handleSubmit(new Event('submit') as any, finalTranscriptRef.current);
      finalTranscriptRef.current = ''; // Clear the ref after processing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if(scrollableView) {
                 scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, 100);
  };

  const handleAiQuery = async (userText: string) => {
    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev.filter(m => m.role !== 'welcome'), newUserMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const userData = await getAllUserDataForAI();
      const currentMessagesForAI = [...messages.filter(m => m.role !== 'welcome'), newUserMessage].map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.text }],
      }));

      const responseText = await conversationalAgent({
          history: currentMessagesForAI,
          userData: userData,
      });
      
      if (responseText) {
        const newAiMessage: Message = { id: Date.now().toString() + '-ai', role: 'model', text: responseText };
        setMessages(prev => [...prev, newAiMessage]);
      } else {
        throw new Error("A resposta da IA está vazia ou em formato inesperado.");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Erro no Chat",
        description: error.message || "Não foi possível obter uma resposta da IA.",
        variant: "destructive",
      });
      const errorMessage: Message = { id: 'error', role: 'model', text: 'Desculpe, ocorreu um erro ao tentar me comunicar com a IA. Por favor, tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };
  

  const handleSubmit = async (e: React.FormEvent, text?: string) => {
    e.preventDefault();
    const userText = text || input;
    if (!userText.trim() || isLoading) return;

    // The chat page now ONLY handles conversational queries.
    await handleAiQuery(userText);
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
      if(nowPlaying) {
          if(audioRef.current) audioRef.current.pause();
          if(nowPlaying === messageId) {
              setNowPlaying(null);
              return;
          }
      }

      setNowPlaying(messageId);
      try {
          const response = await textToSpeech(text);
          if (audioRef.current) {
              audioRef.current.src = response.audioDataUri;
              audioRef.current.play();
          }
      } catch (error: any) {
          console.error("TTS error:", error);
          toast({
              title: "Erro de Áudio",
              description: "Não foi possível gerar o áudio.",
              variant: "destructive",
          });
          setNowPlaying(null);
      }
  };
  
  const handleMicClick = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
        <PageHeader
            title="Assistente IA"
            description="Converse com a IA para obter insights sobre seus dados de saúde."
        />
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-lg">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => {
                  if (message.role === 'welcome') {
                    return (
                        <Alert variant="info" key="welcome-message">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Olá! Como posso ajudar?</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">Eu posso responder perguntas sobre seus dados de saúde registrados nos **últimos 90 dias**.</p>
                                <strong className="block mb-1">Experimente dizer ou perguntar:</strong>
                                <ul className="list-disc list-inside text-xs">
                                    <li>Qual foi minha última glicemia?</li>
                                    <li>Liste minhas últimas 3 hiperglicemias.</li>
                                    <li>Resuma meus dados da última semana.</li>
                                    <li>Como minha glicemia reagiu após a caminhada de ontem?</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )
                  }
                  return (
                    <div
                        key={message.id}
                        className={cn(
                        'flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {message.role === 'model' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        )}
                        <div
                        className={cn(
                            'rounded-xl p-3 max-w-[80%] break-words text-sm whitespace-pre-wrap',
                            message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                        >
                            {message.text}
                            {message.role === 'model' && (
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 ml-2 mt-1"
                                    onClick={() => handlePlayAudio(message.id, message.text)}
                                    disabled={isLoading}
                                    >
                                        {nowPlaying === message.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                        {message.role === 'user' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-foreground" />
                        </div>
                        )}
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                     <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                         <Bot className="h-5 w-5 text-primary" />
                      </div>
                     <div className="rounded-xl p-3 bg-muted flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    {hasRecognitionSupport && (
                        <Button 
                            type="button" 
                            size="icon" 
                            variant={isListening ? 'destructive' : 'outline'}
                            onClick={handleMicClick}
                            disabled={isLoading}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                    )}
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte algo sobre seus dados..."
                        className="flex-1"
                        disabled={isLoading || isListening}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
        <audio ref={audioRef} onEnded={() => setNowPlaying(null)} className="hidden" />
    </div>
  );
}
