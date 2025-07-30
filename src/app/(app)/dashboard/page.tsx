
'use client';

import Link from 'next/link';
import { useEffect, useState, Fragment } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Pill, Camera, BarChart3, Loader2, Bike, ClipboardPlus, Calculator } from 'lucide-react';
import type { GlucoseReading, InsulinLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs } from '@/lib/storage'; 
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';
import WelcomeGoalsModal from '@/components/profile/WelcomeGoalsModal';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useLogDialog } from '@/contexts/LogDialogsContext';

export default function DashboardPage() {
  const [lastGlucose, setLastGlucose] = useState<GlucoseReading | null>(null);
  const [allGlucose, setAllGlucose] = useState<GlucoseReading[]>([]);
  const [lastInsulin, setLastInsulin] = useState<InsulinLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const { toast } = useToast();
  const { openDialog } = useLogDialog();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);

        // Se o perfil existe, mas as metas não foram definidas, abra o modal de boas-vindas.
        if (profile && (profile.target_glucose_low === undefined || profile.target_glucose_low === null)) {
          setIsWelcomeModalOpen(true);
        }

        const glucoseReadings = await getGlucoseReadings(profile);
        setAllGlucose(glucoseReadings);
        if (glucoseReadings.length > 0) {
          setLastGlucose(glucoseReadings[0]);
        }
        
        const insulinLogs = await getInsulinLogs();
        if (insulinLogs.length > 0) {
          setLastInsulin(insulinLogs[0]);
        }

      } catch (error: any) {
        toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
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

        {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
        ) : (
            userProfile && <DashboardStats 
              userProfile={userProfile} 
              glucoseReadings={allGlucose}
              lastGlucose={lastGlucose}
              lastInsulin={lastInsulin}
            />
        )}
        
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

      </div>
    </Fragment>
  );
}

