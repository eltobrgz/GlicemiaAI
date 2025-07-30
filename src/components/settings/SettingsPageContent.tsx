
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; // Keep if used elsewhere, FormLabel is preferred in Forms
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LogOut, Palette, Bell, Shield, Languages, FileText, Moon, Sun, Loader2, Mail, KeyRound, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { getUserProfile, saveUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel as ShadFormLabel, FormMessage } from '@/components/ui/form'; // Renamed FormLabel

const THEME_STORAGE_KEY = 'glicemiaai-theme';
const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (United States)' },
];

const changeEmailSchema = z.object({
  newEmail: z.string().email('Por favor, insira um email válido.'),
  // confirmNewEmail: z.string().email('Please enter a valid email.'), // Optional: for confirmation field
});
// .refine((data) => data.newEmail === data.confirmNewEmail, { // Optional
//   message: "Os emails não coincidem.",
//   path: ["confirmNewEmail"],
// });

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;


export default function SettingsPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-BR');
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const supabase = createClient();

  const changeEmailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: '',
      // confirmNewEmail: '', // Optional
    },
  });

  useEffect(() => {
    setIsClient(true); 
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
      setDarkMode(storedTheme === 'dark');
    } else {
      setDarkMode(prefersDark);
    }

    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        setSelectedLanguage(profile?.languagePreference || 'pt-BR');
        if (profile?.email) {
          // changeEmailForm.setValue('newEmail', profile.email); // Pre-fill if desired, or leave blank
        }
      } catch (error) {
        console.error("Failed to fetch user profile for settings:", error);
        toast({ title: "Erro ao carregar preferências", description: "Não foi possível carregar suas preferências.", variant: "destructive"});
      }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isClient) return; 

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode, isClient]);

  const handleLanguageChange = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    if (userProfile) {
      setIsSavingLanguage(true);
      try {
        const updatedProfile = { ...userProfile, languagePreference: newLanguage };
        await saveUserProfile(updatedProfile);
        setUserProfile(updatedProfile); 
        toast({ title: "Preferência de Idioma Salva", description: `Idioma alterado para ${LANGUAGES.find(l => l.value === newLanguage)?.label}.` });
      } catch (error: any) {
        toast({ title: "Erro ao Salvar Idioma", description: error.message, variant: "destructive" });
        setSelectedLanguage(userProfile.languagePreference || 'pt-BR'); 
      } finally {
        setIsSavingLanguage(false);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Erro ao Sair", description: error.message, variant: "destructive" });
      setIsLoggingOut(false);
    } else {
      toast({ title: "Logout Realizado", description: "Você foi desconectado com sucesso." });
      // Use window.location.reload() for a full page refresh to ensure state is cleared.
      window.location.reload();
    }
  };

  const handleChangePassword = async () => {
    if (!userProfile?.email) {
      toast({ title: "Erro", description: "Email do usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email, {
        // redirectTo: `${window.location.origin}/auth/update-password`, // Set your app's update password page
      });
      if (error) throw error;
      toast({
        title: "Email de Redefinição Enviado",
        description: `Um email com instruções para redefinir sua senha foi enviado para ${userProfile.email}.`,
      });
    } catch (error: any) {
      toast({ title: "Erro ao Redefinir Senha", description: error.message, variant: "destructive" });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const onUpdateEmailSubmit = async (data: ChangeEmailFormData) => {
    if (!userProfile) return;
    if (data.newEmail === userProfile.email) {
      toast({ title: "Email Inalterado", description: "O novo email é o mesmo que o atual.", variant: "default" });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: data.newEmail });
      if (error) throw error;
      toast({
        title: "Confirmação de Email Necessária",
        description: `Um email de confirmação foi enviado para ${data.newEmail}. Siga as instruções para concluir a alteração. Pode ser necessário fazer login novamente.`,
        duration: 10000, // Longer duration for this important message
      });
      // It's good practice to also update the email in the `profiles` table if you store it there,
      // perhaps after the user confirms the new email, or via a Supabase function/trigger.
      // For now, this only updates the auth.users.email.
      changeEmailForm.reset();
    } catch (error: any) {
      toast({ title: "Erro ao Alterar Email", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };


  if (!isClient || !userProfile) { 
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
                         {i === 2 && <div className="h-10 bg-muted rounded"></div>}
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
            <Button 
              variant="outline" 
              id="change-password" 
              className="mt-1 w-full sm:w-auto" 
              onClick={handleChangePassword}
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              {isSendingResetEmail ? 'Enviando email...' : 'Redefinir minha senha'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Um email será enviado para {userProfile.email} com instruções.</p>
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
            <Mail className="mr-2 h-5 w-5" /> Alterar Endereço de Email
          </CardTitle>
          <CardDescription>Altere o email associado à sua conta GlicemiaAI.</CardDescription>
        </CardHeader>
        <Form {...changeEmailForm}>
          <form onSubmit={changeEmailForm.handleSubmit(onUpdateEmailSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                  control={changeEmailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <ShadFormLabel htmlFor="newEmail">Novo Email</ShadFormLabel>
                      <FormControl>
                        <Input id="newEmail" type="email" placeholder="novo@email.com" {...field} disabled={isUpdatingEmail} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Optional: Confirm New Email Field
                <FormField
                  control={changeEmailForm.control}
                  name="confirmNewEmail"
                  render={({ field }) => (
                    <FormItem>
                      <ShadFormLabel htmlFor="confirmNewEmail">Confirmar Novo Email</ShadFormLabel>
                      <FormControl>
                        <Input id="confirmNewEmail" type="email" placeholder="Confirme o novo email" {...field} disabled={isUpdatingEmail} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                 <p className="text-xs text-muted-foreground">Seu email atual é: {userProfile.email}</p>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdatingEmail} className="w-full sm:w-auto">
                {isUpdatingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                {isUpdatingEmail ? 'Salvando...' : 'Salvar Novo Email'}
              </Button>
            </CardFooter>
          </form>
        </Form>
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
            <Languages className="mr-2 h-5 w-5" /> Idioma
          </CardTitle>
           <CardDescription>Defina o idioma para as respostas da IA e futuras traduções da interface.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 rounded-lg border">
          <div className="space-y-2">
            <Label htmlFor="language-select">Idioma Preferido</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isSavingLanguage}>
                <SelectTrigger id="language-select" className="flex-grow">
                  <SelectValue placeholder="Selecionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSavingLanguage && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">As respostas da IA serão neste idioma. A tradução da interface pode não ser completa.</p>
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

    </div>
  );
}
