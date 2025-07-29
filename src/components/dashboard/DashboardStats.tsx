
'use client';

import { useMemo } from 'react';
import type { GlucoseReading, UserProfile } from '@/types';
import { calculateDashboardMetrics, calculateConsecutiveDaysStreak } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Activity, Droplet, Flame } from 'lucide-react';
import TodayGlucoseChart from './TodayGlucoseChart';
import { subHours, parseISO } from 'date-fns';

interface DashboardStatsProps {
  userProfile: UserProfile;
  glucoseReadings: GlucoseReading[];
}

export default function DashboardStats({ userProfile, glucoseReadings }: DashboardStatsProps) {
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
         <Card className="col-span-1 lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-primary">Tendência das Últimas 24 Horas</CardTitle>
              <p className="text-sm text-muted-foreground">Um olhar rápido sobre suas flutuações de glicose recentes.</p>
            </CardHeader>
            <CardContent>
                <TodayGlucoseChart readings={glucoseLast24h} userProfile={userProfile} />
            </CardContent>
          </Card>
    </div>
  );
}

    