import { SideNavigation } from '@/components/SideNavigation';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <SidebarInset>
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <SidebarTrigger className="h-8 w-8" />
          <div className="flex items-center gap-2">
            <AppLogo className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary font-headline">GlicemiaAI</span>
          </div>
        </div>

        {/* Added pb-20 for mobile to ensure content doesn't hide behind bottom nav */}
        {/* md:pb-8 restores original padding for desktop */}
        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8"> 
          {children}
        </div>
      </SidebarInset>

      <BottomNavigationBar />
    </div>
  );
}
