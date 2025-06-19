
import type { Metadata } from 'next';
import AppLogo from '@/components/AppLogo';

export const metadata: Metadata = {
  title: 'Autenticação - GlicemiaAI',
  description: 'Acesse ou crie sua conta no GlicemiaAI.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <AppLogo className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold text-primary font-headline">GlicemiaAI</h1>
        <p className="text-muted-foreground">Seu assistente inteligente para o controle da glicemia.</p>
      </div>
      <main className="w-full max-w-md">
        {children}
      </main>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GlicemiaAI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
