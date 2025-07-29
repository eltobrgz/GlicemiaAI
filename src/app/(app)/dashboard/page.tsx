
'use client';

import Link from 'next/link';
import { useEffect, useState, Fragment } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Pill, Camera, PlusCircle, BarChart3, Loader2, Bike, ClipboardPlus, Calculator } from 'lucide-react';
import type { GlucoseReading, InsulinLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs } from '@/lib/storage'; 
import { formatDateTime, getGlucoseLevelColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';
import WelcomeGoalsModal from '@/components/profile/WelcomeGoalsModal';
import DashboardStats from '@/components/dashboard/DashboardStats';

export default function DashboardPage() {
  const [lastGlucose, setLastGlucose] = useState<GlucoseReading | null>(null);
  const [allGlucose, setAllGlucose] = useState<GlucoseReading[]>([]);
  const [lastInsulin, setLastInsulin] = useState<InsulinLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const { toast } = useToast();

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
             <div className="flex items-center justify-center h-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
        ) : (
            userProfile && <DashboardStats userProfile={userProfile} glucoseReadings={allGlucose} />
        )}
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 font-headline">Acesso Rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {quickAccessItems.map((item) => (
              <Link href={item.href} key={item.href} className="block group">
                  <Card className="shadow-md hover:shadow-lg transition-all duration-200 ease-in-out group-hover:border-primary">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 sm:h-36">
                      <item.icon className={`h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 ${item.iconColor} transition-transform group-hover:scale-110`} />
                      <span className="font-medium text-sm sm:text-base text-card-foreground group-hover:text-primary">{item.label}</span>
                    </CardContent>
                  </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplet className="mr-2 h-6 w-6 text-primary" />
                Última Glicemia Registrada
              </CardTitle>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {!isLoading && lastGlucose && (
                <CardDescription>{formatDateTime(lastGlucose.timestamp)}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : lastGlucose ? (
                <div>
                  <p className={`text-4xl font-bold ${getGlucoseLevelColor(lastGlucose.level, userProfile || undefined)}`}>
                    {lastGlucose.value} <span className="text-xl text-muted-foreground">mg/dL</span>
                  </p>
                  {lastGlucose.mealContext && <p className="text-sm text-muted-foreground capitalize">Contexto: {lastGlucose.mealContext.replace('_', ' ')}</p>}
                  {lastGlucose.notes && <p className="text-sm text-muted-foreground">Notas: {lastGlucose.notes}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum registro de glicemia encontrado.</p>
              )}
              <Link href="/log/glucose">
                <Button variant="outline" className="mt-4 w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Registro
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="mr-2 h-6 w-6 text-accent" />
                Última Insulina Registrada
              </CardTitle>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-accent" />}
              {!isLoading && lastInsulin && (
                <CardDescription>{formatDateTime(lastInsulin.timestamp)}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : lastInsulin ? (
                <div>
                  <p className="text-3xl font-bold">
                    {lastInsulin.dose} <span className="text-xl text-muted-foreground">unidades</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Tipo: {lastInsulin.type}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum registro de insulina encontrado.</p>
              )}
              <Link href="/log/insulin">
                <Button variant="outline" className="mt-4 w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Registro
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
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

const quickAccessItems = [
  { href: '/log/glucose', label: 'Glicemia', icon: Droplet, iconColor: 'text-blue-500' },
  { href: '/log/insulin', label: 'Insulina', icon: Pill, iconColor: 'text-green-500' },
  { href: '/log/medication', label: 'Medicamento', icon: ClipboardPlus, iconColor: 'text-purple-500' },
  { href: '/log/activity', label: 'Atividade', icon: Bike, iconColor: 'text-orange-500' },
  { href: '/meal-analysis', label: 'Refeição', icon: Camera, iconColor: 'text-red-500' },
  { href: '/bolus-calculator', label: 'Calculadora', icon: Calculator, iconColor: 'text-indigo-500' },
];

    