
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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
    const getSessionAndUser = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (!currentSession) {
        router.replace('/login');
        setLoading(false);
        return;
      }
      
      await fetchUserReminders(currentSession.user.id);
      setLoading(false);
    };

    getSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === 'SIGNED_OUT' || (!newSession && event !== 'INITIAL_SESSION')) {
        router.replace('/login');
        setReminders([]); 
      } else if (newSession?.user) {
        await fetchUserReminders(newSession.user.id);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, fetchUserReminders]);


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

      if (clickedNotificationData?.reminderType === 'insulina') {
        let url = '/log/insulin';
        const queryParams = new URLSearchParams();
        if (clickedNotificationData.insulinType) {
          queryParams.append('type', clickedNotificationData.insulinType);
        }
        if (clickedNotificationData.insulinDose !== undefined) {
          queryParams.append('dose', clickedNotificationData.insulinDose.toString());
        }
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        router.push(url);
      } else if (clickedNotificationData?.reminderType === 'glicemia') {
        router.push('/log/glucose');
      }
      notification.close();
    };
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!user || reminders.length === 0 || notificationPermission !== 'granted') {
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
  }, [reminders, user, lastCheckedMinute, notificationPermission, router]);


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4 text-lg">Carregando...</p>
      </div>
    );
  }
  
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
