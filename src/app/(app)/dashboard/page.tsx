
'use client';

import Link from 'next/link';
import { useEffect, useState, Fragment } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Pill, Camera, BarChart3, Loader2, Bike, ClipboardPlus, Calculator, Award, Star } from 'lucide-react';
import type { GlucoseReading, InsulinLog, MealAnalysis, ActivityLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs, getUserProfile, getMealAnalyses, getActivityLogs, checkAndUnlockAchievements } from '@/lib/storage'; 
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import WelcomeGoalsModal from '@/components/profile/WelcomeGoalsModal';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useLogDialog } from '@/contexts/LogDialogsContext';


export default function DashboardPage() {
  const [lastGlucose, setLastGlucose] = useState<GlucoseReading | null>(null);
  const [allGlucose, setAllGlucose] = useState<GlucoseReading[]>([]);
  const [lastInsulin, setLastInsulin] = useState<InsulinLog | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const { toast } = useToast();
  const { openDialog, addSuccessListener } = useLogDialog();
  

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);

        if (profile) {
          if (profile.target_glucose_low === undefined || profile.target_glucose_low === null) {
            setIsWelcomeModalOpen(true);
          }
          
          const [glucoseReadings, insulinLogs] = await Promise.all([
            getGlucoseReadings(profile),
            getInsulinLogs(),
          ]);
          
          setAllGlucose(glucoseReadings);
          if (glucoseReadings.length > 0) {
            setLastGlucose(glucoseReadings[0]);
          }
          if (insulinLogs.length > 0) {
            setLastInsulin(insulinLogs[0]);
          }

          // Check for achievements on dashboard load
          await checkAndUnlockAchievements();
        }
      } catch (error: any) {
        if (error.message !== 'Usuário não autenticado.') {
            toast({ title: "Erro ao buscar dados do dashboard", description: error.message, variant: "destructive" });
        }
      }
    };

    fetchInitialData();

    // Re-fetch data and re-check achievements after new log entries
    const handleSuccess = () => {
        fetchInitialData();
    }

    const unsubscribeGlucose = addSuccessListener('glucose', handleSuccess);
    const unsubscribeInsulin = addSuccessListener('insulin', handleSuccess);
    const unsubscribeMedication = addSuccessListener('medication', handleSuccess);
    const unsubscribeActivity = addSuccessListener('activity', handleSuccess);
    
    return () => {
      unsubscribeGlucose();
      unsubscribeInsulin();
      unsubscribeMedication();
      unsubscribeActivity();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleModalClose = (goalsUpdated: boolean) => {
    setIsWelcomeModalOpen(false);
    if (goalsUpdated) {
      window.location.reload();
    }
  };

  const quickAccessItems = [
    { type: 'glucose', label: 'Glicemia', icon: Droplet, iconColor: 'text-blue-500' },
    { type: 'insulin', label: 'Insulina', icon: Pill, iconColor: 'text-green-500' },
    { type: 'medication', label: 'Medicamento', icon: ClipboardPlus, iconColor: 'text-purple-500' },
    { type: 'activity', label: 'Atividade', icon: Bike, iconColor: 'text-orange-500' },
    { href: '/meal-analysis', label: 'Refeição', icon: Camera, iconColor: 'text-red-500' },
    { href: '/bolus-calculator', label: 'Calculadora', icon: Calculator, iconColor: 'text-indigo-500' },
  ];

  if (!userProfile) {
    return (
       <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
       </div>
    )
  }

  return (
    <Fragment>
      {userProfile && (
        <WelcomeGoalsModal
          userProfile={userProfile}
          isOpen={isWelcomeModalOpen}
          onClose={handleModalClose}
        />
      )}
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="Bem-vindo(a) ao GlicemiaAI! Seu painel de controle para gerenciamento de diabetes." />

        <DashboardStats 
          userProfile={userProfile} 
          glucoseReadings={allGlucose}
          lastGlucose={lastGlucose}
          lastInsulin={lastInsulin}
        />
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-headline">Acesso Rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {quickAccessItems.map((item) => {
              if (item.href) {
                return (
                   <Link href={item.href} key={item.label} className="block group">
                      <Card className="shadow-md hover:shadow-lg transition-all duration-200 ease-in-out group-hover:border-primary">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 sm:h-36">
                          <item.icon className={`h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 ${item.iconColor} transition-transform group-hover:scale-110`} />
                          <span className="font-medium text-sm sm:text-base text-card-foreground group-hover:text-primary">{item.label}</span>
                        </CardContent>
                      </Card>
                  </Link>
                );
              }
              return (
                <button
                  key={item.label}
                  onClick={() => openDialog(item.type as any)}
                  className="block group text-left w-full"
                >
                  <Card className="shadow-md hover:shadow-lg transition-all duration-200 ease-in-out group-hover:border-primary">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 sm:h-36">
                      <item.icon className={`h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 ${item.iconColor} transition-transform group-hover:scale-110`} />
                      <span className="font-medium text-sm sm:text-base text-card-foreground group-hover:text-primary">{item.label}</span>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-primary" />
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Descubra padrões e receba dicas personalizadas geradas por IA com base nos seus dados da última semana.
              </p>
              <Link href="/insights">
                <Button variant="link" className="mt-2 p-0">Ver minha análise semanal</Button>
              </Link>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-6 w-6 text-yellow-500" />
                Minhas Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Veja suas medalhas e acompanhe seu progresso na jornada de gerenciamento.
              </p>
              <Link href="/achievements">
                <Button variant="link" className="mt-2 p-0">Ver minhas conquistas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </Fragment>
  );
}
