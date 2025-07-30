
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import AppLogo from '@/components/AppLogo'; // Added import

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
      // Do not set loading false here, let the listener handle it
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        router.replace('/dashboard');
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        router.replace('/login');
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <AppLogo className="h-20 w-20 text-primary mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-6 text-2xl font-semibold text-primary">Verificando sua sessão...</p>
        <p className="mt-2 text-muted-foreground">Quase lá!</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <AppLogo className="h-20 w-20 text-primary mb-8" />
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-6 text-2xl font-semibold text-primary">Redirecionando...</p>
      <p className="mt-2 text-muted-foreground">Aguarde, estamos levando você para o app.</p>
    </div>
  );
}
