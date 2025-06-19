
'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SideNavigation } from '@/components/SideNavigation';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (!currentSession) {
        router.replace('/login');
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT' || (!newSession && event !== 'INITIAL_SESSION')) {
        router.replace('/login');
      }
      setLoading(false); // Also set loading to false on auth changes
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4 text-lg">Carregando...</p>
      </div>
    );
  }
  
  // if (!session && !loading) { // Should be caught by the effect, but as a fallback
  //    router.replace('/login'); // This might cause a brief flicker if not handled well
  //    return null; // Or a redirect component
  // }


  return (
    <div className="flex min-h-screen bg-background">
      <SideNavigation />
      
      <SidebarInset>
        <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="h-8 w-8" />
          { (state === 'collapsed' || isMobile) && (
            <div className="flex items-center gap-2">
              <AppLogo className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-primary font-headline">GlicemiaAI</span>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8"> 
          {children}
        </div>
      </SidebarInset>

      <BottomNavigationBar />
    </div>
  );
}
