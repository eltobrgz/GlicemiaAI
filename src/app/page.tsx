
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router, supabase]);

  // This component will only be shown briefly during the initial check and redirect.
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <AppLogo className="h-20 w-20 text-primary mb-8" />
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-6 text-2xl font-semibold text-primary">Verificando sua sessão...</p>
      <p className="mt-2 text-muted-foreground">Quase lá!</p>
    </div>
  );
}
