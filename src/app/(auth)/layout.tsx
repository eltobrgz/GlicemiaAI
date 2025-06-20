
import type { Metadata } from 'next';
import AppLogo from '@/components/AppLogo';
import Image from 'next/image';

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
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Coluna Esquerda - Visível em Telas Maiores (md e acima) */}
      <div className="hidden md:flex md:w-1/2 xl:w-3/5 flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5 p-8 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center max-w-lg">
          <AppLogo className="h-20 w-20 text-primary mb-6" />
          <h1 className="text-4xl lg:text-5xl font-bold text-primary font-headline mb-4">
            Bem-vindo(a) ao GlicemiaAI
          </h1>
          <p className="text-lg lg:text-xl text-foreground/80 mb-8">
            Seu assistente inteligente para um controle glicêmico mais fácil e eficaz. Registre, analise e transforme sua jornada com o diabetes.
          </p>
          <p className="mt-12 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GlicemiaAI. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Coluna Direita (Formulário) - Ocupa a tela inteira em mobile */}
      <div className="w-full md:w-1/2 xl:w-2/5 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Logo e Título para Mobile (aparece acima do formulário) */}
        <div className="md:hidden mb-8 flex flex-col items-center text-center">
          <AppLogo className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold text-primary font-headline">GlicemiaAI</h1>
          <p className="text-sm text-muted-foreground">Seu assistente para o controle da glicemia.</p>
        </div>
        
        <main className="w-full max-w-lg"> {/* Alterado de max-w-md para max-w-lg */}
          {children}
        </main>
        
        {/* Footer para Mobile (aparece abaixo do formulário) */}
        <footer className="md:hidden mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GlicemiaAI. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
