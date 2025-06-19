
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Adicionado import
import { Separator } from '@/components/ui/separator';
import { LogOut, Palette, Bell, Shield, Languages, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPageContent() {
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    // Em uma aplicação real, você invalidaria a sessão/token aqui
    toast({
      title: "Logout Realizado",
      description: "Você foi desconectado com sucesso.",
    });
    router.push('/login');
  };

  return (
    <div className="space-y-8">
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
            <Button variant="outline" id="change-password" className="mt-1 w-full sm:w-auto">
              Redefinir minha senha
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Você será redirecionado para alterar sua senha.</p>
          </div>
          <Separator />
           <div>
            <Label htmlFor="manage-data">Gerenciamento de Dados</Label>
            <Button variant="outline" id="manage-data" className="mt-1 w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" /> Exportar meus dados
            </Button>
             <p className="text-xs text-muted-foreground mt-1">Solicite uma cópia dos seus dados armazenados.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
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
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-base">Modo Escuro</Label>
              <p className="text-xs text-muted-foreground">Ative para uma interface com cores escuras.</p>
            </div>
            <Switch id="dark-mode" aria-label="Ativar modo escuro" />
          </div>
          {/* Mais opções de aparência podem ser adicionadas aqui */}
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
          <div className="flex items-center justify-between">
             <div>
              <Label htmlFor="glucose-reminders" className="text-base">Lembretes de Glicemia</Label>
               <p className="text-xs text-muted-foreground">Receber notificações para registrar glicemia.</p>
            </div>
            <Switch id="glucose-reminders" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
             <div>
              <Label htmlFor="insulin-reminders" className="text-base">Lembretes de Insulina</Label>
               <p className="text-xs text-muted-foreground">Receber notificações para administrar insulina.</p>
            </div>
            <Switch id="insulin-reminders" defaultChecked />
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
        <CardContent>
          <Label htmlFor="language-select">Idioma do Aplicativo</Label>
          {/* Implementar um Select real aqui se múltiplos idiomas forem suportados */}
          <Input id="language-select" value="Português (Brasil)" readOnly className="mt-1 bg-muted cursor-not-allowed" />
           <p className="text-xs text-muted-foreground mt-1">Atualmente, apenas Português (Brasil) está disponível.</p>
        </CardContent>
      </Card>

    </div>
  );
}
