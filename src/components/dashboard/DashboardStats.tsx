
'use client';

import { useMemo } from 'react';
import type { GlucoseReading, InsulinLog, UserProfile } from '@/types';
import { calculateDashboardMetrics, calculateConsecutiveDaysStreak, getGlucoseLevelColor, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Activity, Droplet, Flame, Pill, PlusCircle } from 'lucide-react';
import TodayGlucoseChart from './TodayGlucoseChart';
import { subHours, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import Link from 'next/link';

interface DashboardStatsProps {
  userProfile: UserProfile;
  glucoseReadings: GlucoseReading[];
  lastGlucose: GlucoseReading | null;
  lastInsulin: InsulinLog | null;
}

export default function DashboardStats({ userProfile, glucoseReadings, lastGlucose, lastInsulin }: DashboardStatsProps) {
  const metrics = useMemo(
    () => calculateDashboardMetrics(glucoseReadings, userProfile),
    [glucoseReadings, userProfile]
  );
  
  const streak = useMemo(
    () => calculateConsecutiveDaysStreak(glucoseReadings),
    [glucoseReadings]
  );

  const glucoseLast24h = useMemo(() => {
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return glucoseReadings
      .filter(r => parseISO(r.timestamp) >= twentyFourHoursAgo)
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [glucoseReadings]);

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Média Glicêmica (7d)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {metrics.averageGlucose !== null ? `${metrics.averageGlucose.toFixed(0)} mg/dL` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.totalReadings} registros nos últimos 7 dias</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo no Alvo (7d)</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.timeInTarget.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                       Alvo: {userProfile.target_glucose_low}-{userProfile.target_glucose_high} mg/dL
                    </p>
                    <Progress value={metrics.timeInTarget} className="mt-2 h-2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Eventos Hipo/Hiper (7d)</CardTitle>
                    <Droplet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.hypoEvents} / {metrics.hyperEvents}</div>
                    <p className="text-xs text-muted-foreground">Eventos de hipoglicemia / hiperglicemia</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sequência de Registros</CardTitle>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{streak} {streak === 1 ? 'dia' : 'dias'}</div>
                    <p className="text-xs text-muted-foreground">Dias consecutivos registrando glicemia</p>
                </CardContent>
            </Card>
        </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card className="shadow-lg h-full">
                    <CardHeader>
                        <CardTitle className="text-xl font-headline text-primary">Tendência das Últimas 24 Horas</CardTitle>
                        <CardDescription>Um olhar rápido sobre suas flutuações de glicose recentes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TodayGlucoseChart readings={glucoseLast24h} userProfile={userProfile} />
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Droplet className="mr-2 h-6 w-6 text-primary" />
                            Última Glicemia
                        </CardTitle>
                        {lastGlucose && <CardDescription>{formatDateTime(lastGlucose.timestamp)}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        {lastGlucose ? (
                            <div>
                                <p className={`text-4xl font-bold ${getGlucoseLevelColor(lastGlucose.level, userProfile || undefined)}`}>
                                    {lastGlucose.value} <span className="text-xl text-muted-foreground">mg/dL</span>
                                </p>
                                {lastGlucose.mealContext && <p className="text-sm text-muted-foreground capitalize">Contexto: {lastGlucose.mealContext.replace('_', ' ')}</p>}
                                {lastGlucose.notes && <p className="text-sm text-muted-foreground truncate" title={lastGlucose.notes}>Notas: {lastGlucose.notes}</p>}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Nenhum registro de glicemia.</p>
                        )}
                         <Link href="/log/glucose">
                            <Button variant="outline" size="sm" className="mt-4 w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="flex items-center">
                        <Pill className="mr-2 h-6 w-6 text-accent" />
                        Última Insulina
                    </CardTitle>
                    {lastInsulin && <CardDescription>{formatDateTime(lastInsulin.timestamp)}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        {lastInsulin ? (
                            <div>
                                <p className="text-3xl font-bold">
                                    {lastInsulin.dose} <span className="text-xl text-muted-foreground">unidades</span>
                                </p>
                                <p className="text-sm text-muted-foreground truncate" title={lastInsulin.type}>Tipo: {lastInsulin.type}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Nenhum registro de insulina.</p>
                        )}
                        <Link href="/log/insulin">
                            <Button variant="outline" size="sm" className="mt-4 w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

    
