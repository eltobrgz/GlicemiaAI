
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep if used elsewhere, though FormLabel is preferred with FormField
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Loader2, MailQuestion } from 'lucide-react';
import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const forgotPasswordSchema = z.object({
  resetEmail: z.string().email('Por favor, insira um email válido.'),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const supabase = getBrowserClient();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      resetEmail: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Login Bem-sucedido!',
        description: 'Redirecionando para o painel...',
      });
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Erro no Login',
        description: error.message || 'Falha ao tentar fazer login. Verifique suas credenciais.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.resetEmail, {
        // redirectTo: `${window.location.origin}/update-password`, // Uncomment and set your update password page route
      });
      if (error) {
        throw error;
      }
      toast({
        title: 'Email de Redefinição Enviado',
        description: `Se uma conta existir para ${data.resetEmail}, um email com instruções para redefinir sua senha foi enviado.`,
      });
      setForgotPasswordDialogOpen(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: 'Erro ao Enviar Email',
        description: error.message || 'Não foi possível enviar o email de redefinição de senha.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-xl">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline text-primary">Acesse sua Conta</CardTitle>
              <CardDescription>Bem-vindo(a) de volta! Insira seus dados para continuar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email-login">Email</FormLabel>
                    <FormControl>
                      <Input id="email-login" type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password-login">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          id="password-login" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Sua senha" 
                          {...field} 
                          className="pr-10"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          <span className="sr-only">{showPassword ? 'Esconder' : 'Mostrar'} senha</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-right">
                <AlertDialog open={forgotPasswordDialogOpen} onOpenChange={setForgotPasswordDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="link" type="button" className="text-sm text-primary hover:underline p-0 h-auto">
                      Esqueceu sua senha?
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center"><MailQuestion className="mr-2 h-5 w-5"/>Redefinir Senha</AlertDialogTitle>
                      <AlertDialogDescription>
                        Digite seu endereço de e-mail abaixo. Se uma conta estiver associada a ele, enviaremos um link para redefinir sua senha.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} id="forgotPasswordForm" className="space-y-4">
                        <FormField
                          control={forgotPasswordForm.control}
                          name="resetEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor="resetEmail" className="sr-only">Email para redefinição</FormLabel>
                              <FormControl>
                                <Input id="resetEmail" type="email" placeholder="seu@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isResettingPassword}>Cancelar</AlertDialogCancel>
                      <Button type="submit" form="forgotPasswordForm" disabled={isResettingPassword}>
                        {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Link de Redefinição
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Não tem uma conta?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
