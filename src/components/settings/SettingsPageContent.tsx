
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogOut, Palette, Bell, Shield, Languages, FileText, Moon, Sun, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const THEME_STORAGE_KEY = 'glicemiaai-theme';

export default function SettingsPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true); // Component has mounted
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
      setDarkMode(storedTheme === 'dark');
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run on server or before mount

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode, isClient]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao Sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout Realizado",
        description: "Você foi desconectado com sucesso.",
      });
      router.push('/login');
      router.refresh();
    }
    setIsLoggingOut(false);
  };

  if (!isClient) { // Render skeleton or null during SSR / pre-hydration
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {[1,2,3].map(i => (
                <Card key={i} className="shadow-lg animate-pulse">
                    <CardHeader>
                        <div className="h-6 w-3/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/2 bg-muted rounded mt-1"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-10 bg-muted rounded"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Shield className="mr-2 h-5 w-5" /> Segurança e Conta
          </CardTitle>
          <CardDescription>Gerencie suas informações de login e segurança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="change-password">Alterar Senha</Label>
            <Button variant="outline" id="change-password" className="mt-1 w-full sm:w-auto" onClick={() => toast({title: "Funcionalidade Pendente", description: "Alteração de senha será implementada."})}>
              Redefinir minha senha
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Você será redirecionado para alterar sua senha.</p>
          </div>
          <Separator />
           <div>
            <Label htmlFor="manage-data">Gerenciamento de Dados</Label>
            <Button variant="outline" id="manage-data" className="mt-1 w-full sm:w-auto" onClick={() => toast({title: "Funcionalidade Pendente", description: "Exportação de dados será implementada."})}>
              <FileText className="mr-2 h-4 w-4" /> Exportar meus dados
            </Button>
             <p className="text-xs text-muted-foreground mt-1">Solicite uma cópia dos seus dados armazenados.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto" disabled={isLoggingOut}>
            {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Palette className="mr-2 h-5 w-5" /> Aparência
          </CardTitle>
          <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-3">
              {darkMode ? <Moon className="h-5 w-5 text-sky-400" /> : <Sun className="h-5 w-5 text-yellow-500" />}
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium">Modo Escuro</Label>
                <p className="text-xs text-muted-foreground">Ative para uma interface com cores escuras.</p>
              </div>
            </div>
            <Switch 
              id="dark-mode" 
              checked={darkMode}
              onCheckedChange={setDarkMode}
              aria-label="Ativar modo escuro" 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Bell className="mr-2 h-5 w-5" /> Notificações e Lembretes
          </CardTitle>
          <CardDescription>Controle como e quando você recebe notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example Switch - these would need actual state management if functional */}
          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
             <div>
              <Label htmlFor="glucose-reminders-switch" className="text-base font-medium">Lembretes de Glicemia</Label>
               <p className="text-xs text-muted-foreground">Receber notificações para registrar glicemia.</p>
            </div>
            <Switch id="glucose-reminders-switch" defaultChecked />
          </div>
           <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
             <div>
              <Label htmlFor="insulin-reminders-switch" className="text-base font-medium">Lembretes de Insulina</Label>
               <p className="text-xs text-muted-foreground">Receber notificações para administrar insulina.</p>
            </div>
            <Switch id="insulin-reminders-switch" defaultChecked />
          </div>
          <Button variant="outline" onClick={() => router.push('/reminders')} className="w-full sm:w-auto">
            Gerenciar Lembretes Detalhados
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Languages className="mr-2 h-5 w-5" /> Idioma e Região
          </CardTitle>
           <CardDescription>Defina suas preferências de idioma.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 rounded-lg border">
          <Label htmlFor="language-select">Idioma do Aplicativo</Label>
          <Input id="language-select" value="Português (Brasil)" readOnly className="mt-1 bg-muted cursor-not-allowed" />
           <p className="text-xs text-muted-foreground mt-1">Atualmente, apenas Português (Brasil) está disponível.</p>
        </CardContent>
      </Card>

    </div>
  );
}
