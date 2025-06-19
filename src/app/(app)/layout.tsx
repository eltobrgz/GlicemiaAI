'use client'; // Necessário para usar o hook useSidebar

import { SideNavigation } from '@/components/SideNavigation';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'; // Importa useSidebar
import AppLogo from '@/components/AppLogo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar(); // Hook para obter o estado da sidebar

  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <SidebarInset>
        {/* Cabeçalho do Conteúdo Principal (anteriormente "Mobile Header") */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="h-8 w-8" />
          {/* Mostra o logo e nome do app no cabeçalho do conteúdo se a sidebar estiver recolhida ou se for mobile */}
          { (state === 'collapsed' || isMobile) && (
            <div className="flex items-center gap-2">
              <AppLogo className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary font-headline">GlicemiaAI</span>
            </div>
          )}
        </div>

        {/* Ajustado pb-20 para mobile para garantir que o conteúdo não fique atrás da nav inferior */}
        {/* md:pb-8 restaura o padding original para desktop */}
        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8"> 
          {children}
        </div>
      </SidebarInset>

      <BottomNavigationBar />
    </div>
  );
}
