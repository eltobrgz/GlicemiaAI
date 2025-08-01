
'use client';

import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, Bot, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { conversationalAgent } from '@/ai/flows/conversational-agent';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getAllUserDataForAI } from '@/lib/storage';

interface Message {
  role: 'user' | 'model' | 'welcome';
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'welcome', text: 'Welcome Message' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev.filter(m => m.role !== 'welcome'), newUserMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // 1. Fetch user data before calling the agent
      const userData = await getAllUserDataForAI();

      // 2. Prepare the history for the AI
      const currentMessagesForAI = [...messages.filter(m => m.role !== 'welcome'), newUserMessage].map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.text }],
      }));

      // 3. Call the agent with history and user data
      const responseText = await conversationalAgent({
          history: currentMessagesForAI,
          userData: userData
      });
      
      if (responseText) {
        const newAiMessage: Message = { role: 'model', text: responseText };
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
      const errorMessage: Message = { role: 'model', text: 'Desculpe, ocorreu um erro ao tentar me comunicar com a IA. Por favor, tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
        <PageHeader
            title="Assistente IA"
            description="Converse com a IA para obter insights e respostas sobre seus dados de saúde."
        />
        <div className="flex-1 flex flex-col bg-card border rounded-xl shadow-lg">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => {
                  if (message.role === 'welcome') {
                    return (
                        <Alert variant="info" key="welcome-message">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Olá! Como posso ajudar?</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">Eu posso responder perguntas sobre seus dados de saúde registrados nos últimos 30 dias. Lembre-se, eu sou uma IA e não um profissional de saúde.</p>
                                <strong className="block mb-1">Experimente perguntar:</strong>
                                <ul className="list-disc list-inside text-xs">
                                    <li>Qual foi minha última glicemia?</li>
                                    <li>Qual minha maior glicemia no último mês?</li>
                                    <li>Fiz algum exercício hoje?</li>
                                    <li>Resuma meus dados da última semana.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )
                  }
                  return (
                    <div
                        key={index}
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
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte algo..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
                </form>
            </div>
        </div>
    </div>
  );
}
