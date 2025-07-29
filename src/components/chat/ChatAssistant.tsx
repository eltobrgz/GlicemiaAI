
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, Bot, User, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { conversationalAgent } from '@/ai/flows/conversational-agent';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'model' | 'welcome';
  text: string;
}

const CHAT_ASSISTANT_POSITION_KEY = 'glicemiaai-chat-assistant-position';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  useEffect(() => {
    const setInitialPosition = () => {
       try {
        const savedPosition = localStorage.getItem(CHAT_ASSISTANT_POSITION_KEY);
        if (savedPosition) {
          const parsedPosition = JSON.parse(savedPosition);
          setPosition(parsedPosition);
        } else {
          const buttonWidth = 48; // w-12
          const buttonHeight = 48; // h-12
          const marginX = window.innerWidth > 768 ? 40 : 24;
          const marginY = window.innerHeight > 768 ? 40 : 24;
          setPosition({
            x: window.innerWidth - buttonWidth - marginX,
            y: window.innerHeight - buttonHeight - marginY - 140, // Adjust for bottom nav bar and voice assistant
          });
        }
      } catch (error) {
        console.error("Failed to parse saved position for chat, using default.", error);
         const buttonWidth = 48;
         const buttonHeight = 48;
         const marginX = window.innerWidth > 768 ? 40 : 24;
         const marginY = window.innerHeight > 768 ? 40 : 24;
        setPosition({
          x: window.innerWidth - buttonWidth - marginX,
          y: window.innerHeight - buttonHeight - marginY - 140,
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
        localStorage.setItem(CHAT_ASSISTANT_POSITION_KEY, JSON.stringify(position));
      }
    }
  };


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && messages.length === 0) {
      setMessages([
        { role: 'welcome', text: 'Welcome Message' },
      ]);
    }
  };

  const handleButtonClick = () => {
      if(wasDragged) return;
      handleOpenChange(!isOpen);
  }

  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.children[0] as HTMLDivElement;
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
    const currentMessages = [...messages.filter(m => m.role !== 'welcome'), newUserMessage].map(msg => ({
      role: msg.role,
      content: [{ text: msg.text }],
    }));
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const responseText = await conversationalAgent(currentMessages);
      
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
      const errorMessage: Message = { role: 'model', text: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
        className="z-50 h-12 w-12 rounded-full shadow-2xl bg-accent hover:bg-accent/90 cursor-grab active:cursor-grabbing"
        size="icon"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleButtonClick}
        aria-label="Assistente de Chat"
        title="Assistente de Chat (clique para abrir, arraste para mover)"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div 
          className="fixed z-50 rounded-xl shadow-2xl bg-card border w-[calc(100vw-32px)] max-w-sm h-[65vh] max-h-[600px] flex flex-col transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-10"
          style={{
             bottom: '80px', // Adjust to be above bottom nav
             right: '16px'
          }}
        >
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary"/>
                    <h3 className="font-semibold text-lg">Assistente GlicemiaAI</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5"/>
                </Button>
            </div>
          
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => {
                  if (message.role === 'welcome') {
                    return (
                        <Alert variant="info" key="welcome-message">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Olá! Como posso ajudar?</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">Eu posso responder perguntas sobre seus dados de saúde. Lembre-se, eu sou uma IA e não um profissional de saúde.</p>
                                <strong className="block mb-1">Experimente perguntar:</strong>
                                <ul className="list-disc list-inside text-xs">
                                    <li>Qual foi minha última glicemia?</li>
                                    <li>Qual minha maior glicemia no último mês?</li>
                                    <li>Qual foi a última dose de insulina que apliquei?</li>
                                    <li>Fiz algum exercício hoje?</li>
                                    <li>Qual o último remédio que registrei?</li>
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
                            'rounded-xl p-3 max-w-[80%] break-words text-sm',
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
      )}
    </>
  );
}
