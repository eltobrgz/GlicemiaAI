import { SideNavigation } from '@/components/SideNavigation';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { SidebarInset } from '@/components/ui/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <SidebarInset>
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
