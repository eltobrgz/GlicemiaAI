
'use client'; 

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SideNavigation } from '@/components/SideNavigation';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppLogo from '@/components/AppLogo';
import { Loader2 } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';
import type { ReminderConfig } from '@/types';
import { getReminders } from '@/lib/storage';
import { DAYS_OF_WEEK } from '@/config/constants';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import { LogDialogsProvider } from '@/contexts/LogDialogsContext';
import { LogDialogs } from '@/components/log/LogDialogs';
import { useToast } from '@/hooks/use-toast';
import ChatAssistant from '@/components/chat/ChatAssistant';

const DAY_MAP: Record<number, typeof DAYS_OF_WEEK[number]['key']> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab'
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isMobile } = useSidebar();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [lastCheckedMinute, setLastCheckedMinute] = useState<number>(-1);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const fetchUserReminders = useCallback(async (currentUserId?: string) => {
    if (!currentUserId) return;
    try {
      const userReminders = await getReminders(); 
      setReminders(userReminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserReminders(session.user.id);
      } else {
        toast({
          title: 'Sessão não encontrada',
          description: 'Por favor, faça o login novamente para continuar.',
          variant: 'destructive'
        });
        router.replace('/login');
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, fetchUserReminders, toast]);


  const showNotification = (reminder: ReminderConfig) => {
    if (notificationPermission !== 'granted') {
      console.warn('Notification permission not granted.');
      return;
    }

    let title = 'Lembrete GlicemiaAI';
    let body = `É hora de: ${reminder.name}`;
    let notificationData: any = { reminderId: reminder.id, reminderType: reminder.type };

    if (reminder.type === 'insulina') {
      body = `É hora de aplicar sua insulina ${reminder.insulinType || reminder.name}`;
      if (reminder.insulinDose) {
        body += ` (${reminder.insulinDose} unidades). Já aplicou?`;
      } else {
        body += `. Já aplicou?`;
      }
      notificationData = {
        ...notificationData,
        insulinType: reminder.insulinType,
        insulinDose: reminder.insulinDose,
      };
    }
    
    if (reminder.isSimulatedCall && reminder.enabled) {
      title = `📞 Chamada de: ${reminder.simulatedCallContact || 'GlicemiaAI'}`;
      body = `Lembrete: ${reminder.name}`;
       if (reminder.type === 'insulina') {
         body = `Lembrete: Aplicar insulina ${reminder.insulinType || reminder.name}`;
         if (reminder.insulinDose) body += ` (${reminder.insulinDose} unidades)`;
      }
    }

    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico', 
      tag: reminder.id, 
      data: notificationData, // Store reminder data in the notification
    });

    notification.onclick = (event) => {
      event.preventDefault(); // Prevent the browser from focusing the Notification's tab
      window.focus(); // Focus the main window
      const clickedNotificationData = (event.currentTarget as Notification)?.data;
      
      // Since pages are now modals, we can't navigate directly.
      // This part would need a more complex implementation to open the correct modal,
      // potentially via the LogDialogsContext. For now, we'll log it.
      console.log("Notification clicked. Modal opening logic would be needed here.", clickedNotificationData);

      notification.close();
    };
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (reminders.length === 0 || notificationPermission !== 'granted') {
        return;
      }

      const now = new Date();
      const currentDay = DAY_MAP[now.getDay() as keyof typeof DAY_MAP];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentMinute = now.getMinutes();

      if (currentMinute === lastCheckedMinute) {
        return; 
      }
      setLastCheckedMinute(currentMinute);

      reminders.forEach(reminder => {
        if (!reminder.enabled) return;

        const isToday = reminder.days === 'todos_os_dias' || (Array.isArray(reminder.days) && reminder.days.includes(currentDay));
        
        if (isToday && reminder.time === currentTime) {
          console.log(`Firing reminder: ${reminder.name} at ${currentTime}`);
          showNotification(reminder);
        }
      });
    }, 15000); 

    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, lastCheckedMinute, notificationPermission]);


  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <AppLogo className="h-20 w-20 text-primary mb-8" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-6 text-2xl font-semibold text-primary">Carregando GlicemiaAI...</p>
        <p className="mt-2 text-muted-foreground">Por favor, aguarde um momento.</p>
      </div>
    );
  }
  
  return (
    <LogDialogsProvider>
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
        <VoiceAssistant />
        <ChatAssistant />
        <LogDialogs />
      </div>
    </LogDialogsProvider>
  );
}
