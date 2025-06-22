
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GlucoseReading, InsulinLog, UserProfile, ActivityLog, MealAnalysis, MedicationLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs, getUserProfile, getActivityLogs, getMealAnalyses, getMedicationLogs } from '@/lib/storage';
import { BarChart3, Lightbulb, TrendingUp, TrendingDown, Activity, CheckCircle, Loader2, Pill, Bike, Utensils, ClipboardPlus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { GLUCOSE_THRESHOLDS } from '@/config/constants';


export default function InsightsDisplay() {
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [insulinLogs, setInsulinLogs] = useState<InsulinLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [mealAnalyses, setMealAnalyses] = useState<MealAnalysis[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);

        const [
          fetchedGlucoseReadings, 
          fetchedInsulinLogs, 
          fetchedActivityLogs,
          fetchedMealAnalyses,
          fetchedMedicationLogs,
        ] = await Promise.all([
          getGlucoseReadings(profile),
          getInsulinLogs(),
          getActivityLogs(),
          getMealAnalyses(),
          getMedicationLogs(),
        ]);
        setGlucoseReadings(fetchedGlucoseReadings);
        setInsulinLogs(fetchedInsulinLogs);
        setActivityLogs(fetchedActivityLogs);
        setMealAnalyses(fetchedMealAnalyses);
        setMedicationLogs(fetchedMedicationLogs);

      } catch (error: any) {
        toast({ title: "Erro ao buscar dados para insights", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const currentGlucoseTargets = useMemo(() => {
    return {
      low: userProfile?.hypo_glucose_threshold ?? GLUCOSE_THRESHOLDS.low,
      normalIdealMin: userProfile?.target_glucose_low ?? GLUCOSE_THRESHOLDS.low,
      normalIdealMax: userProfile?.target_glucose_high ?? GLUCOSE_THRESHOLDS.normalIdealMax,
      high: userProfile?.hyper_glucose_threshold ?? GLUCOSE_THRESHOLDS.high,
    };
  }, [userProfile]);


  const averageGlucose = useMemo(() => {
    if (glucoseReadings.length === 0) return null;
    const sum = glucoseReadings.reduce((acc, r) => acc + r.value, 0);
    return sum / glucoseReadings.length;
  }, [glucoseReadings]);

  const timeInTarget = useMemo(() => {
    if (glucoseReadings.length === 0) return null;
    const targetMin = currentGlucoseTargets.normalIdealMin;
    const targetMax = currentGlucoseTargets.normalIdealMax;
    const inTargetCount = glucoseReadings.filter(r => r.value >= targetMin && r.value <= targetMax).length;
    return (inTargetCount / glucoseReadings.length) * 100;
  }, [glucoseReadings, currentGlucoseTargets]);

  const recentTrend = useMemo(() => {
    if (glucoseReadings.length < 2) return null;
    
    const readingsSorted = [...glucoseReadings].sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
    const last7DaysReadings = readingsSorted.filter(r => parseISO(r.timestamp) > subDays(new Date(), 7));
    
    if(last7DaysReadings.length < 2) return 'stable';

    const prevPeriodEnd = subDays(new Date(), 7);
    const prevPeriodStart = subDays(new Date(), 14);
    const prev7DaysReadings = readingsSorted.filter(r => {
        const date = parseISO(r.timestamp);
        return date <= prevPeriodEnd && date > prevPeriodStart;
      });

    if (last7DaysReadings.length > 0 && prev7DaysReadings.length > 0) {
      const avgLast7 = last7DaysReadings.reduce((acc, r) => acc + r.value, 0) / last7DaysReadings.length;
      const avgPrev7 = prev7DaysReadings.reduce((acc, r) => acc + r.value, 0) / prev7DaysReadings.length;
      if (avgLast7 > avgPrev7 * 1.1) return 'increasing';
      else if (avgLast7 < avgPrev7 * 0.9) return 'decreasing';
      else return 'stable';
    }
    return 'stable';
  }, [glucoseReadings]);

  const last7DaysGlucoseData = useMemo(() => {
    const today = new Date();
    const last7DaysInterval = eachDayOfInterval({ start: subDays(today, 6), end: today });
    return last7DaysInterval.map(day => {
      const readingsForDay = glucoseReadings.filter(r => isSameDay(parseISO(r.timestamp), day));
      const avg = readingsForDay.length ? readingsForDay.reduce((sum, r) => sum + r.value, 0) / readingsForDay.length : 0;
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        averageGlucose: parseFloat(avg.toFixed(1)),
      };
    });
  }, [glucoseReadings]);

  const statsLast7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    
    const recentInsulin = insulinLogs.filter(log => parseISO(log.timestamp) >= sevenDaysAgo);
    const recentActivity = activityLogs.filter(log => parseISO(log.timestamp) >= sevenDaysAgo);
    const recentMeals = mealAnalyses.filter(a => parseISO(a.timestamp) >= sevenDaysAgo);
    const recentMeds = medicationLogs.filter(log => parseISO(log.timestamp) >= sevenDaysAgo);

    return {
      insulin: {
        totalDose: recentInsulin.reduce((sum, log) => sum + log.dose, 0),
        administrations: recentInsulin.length,
      },
      activity: {
        count: recentActivity.length,
        totalDurationMinutes: recentActivity.reduce((sum, log) => sum + log.duration_minutes, 0),
      },
      meals: {
        count: recentMeals.length,
        avgCarbs: recentMeals.length > 0 ? recentMeals.reduce((sum, meal) => sum + meal.macronutrientEstimates.carbohydrates, 0) / recentMeals.length : 0,
      },
      medications: {
        count: recentMeds.length,
      }
    };
  }, [insulinLogs, activityLogs, mealAnalyses, medicationLogs]);


  const chartConfig = {
    averageGlucose: {
      label: "Glicemia Média (mg/dL)",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando insights...</p>
      </div>
    );
  }

  const hasEnoughData = glucoseReadings.length >= 5;

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
         <Lightbulb className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Análise da IA (Simplificada)</AlertTitle>
        <AlertDescription className="text-primary/90">
          Esta seção apresenta uma análise básica dos seus dados. Uma IA mais avançada poderia identificar padrões complexos e fornecer dicas ainda mais personalizadas. As faixas de referência usadas aqui são: Baixa (&lt;{currentGlucoseTargets.low}), Normal ({currentGlucoseTargets.normalIdealMin}-{currentGlucoseTargets.normalIdealMax}), Alta (&gt;{currentGlucoseTargets.normalIdealMax}).
        </AlertDescription>
      </Alert>

      {!hasEnoughData && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Mais Dados Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Continue registrando seus dados de glicemia (pelo menos 5 registros) para obter insights mais detalhados.
            </p>
          </CardContent>
        </Card>
      )}

      {hasEnoughData && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Glicemia Média</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {averageGlucose !== null ? `${averageGlucose.toFixed(1)} mg/dL` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Média de todos os registros de glicemia</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo no Alvo ({currentGlucoseTargets.normalIdealMin}-{currentGlucoseTargets.normalIdealMax} mg/dL)</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {timeInTarget !== null ? `${timeInTarget.toFixed(1)}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Percentual de leituras na meta</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tendência Glicêmica (Últ. 7 dias)</CardTitle>
                {recentTrend === 'increasing' && <TrendingUp className="h-4 w-4 text-red-500" />}
                {recentTrend === 'decreasing' && <TrendingDown className="h-4 w-4 text-green-500" />}
                {recentTrend === 'stable' && <Activity className="h-4 w-4 text-blue-500" />}
                {!recentTrend && <Activity className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  recentTrend === 'increasing' ? 'text-red-500' :
                  recentTrend === 'decreasing' ? 'text-green-500' :
                  recentTrend === 'stable' ? 'text-blue-500' : 'text-muted-foreground'
                }`}>
                  {recentTrend === 'increasing' ? 'Aumentando' :
                   recentTrend === 'decreasing' ? 'Diminuindo' :
                   recentTrend === 'stable' ? 'Estável' : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Comparado com os 7 dias anteriores</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
                <CardTitle>Resumo dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-4">
                    <Pill className="h-8 w-8 text-accent"/>
                    <div>
                        <p className="text-2xl font-bold">{statsLast7Days.insulin.administrations}</p>
                        <p className="text-sm text-muted-foreground">Doses de Insulina</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <ClipboardPlus className="h-8 w-8 text-purple-500"/>
                    <div>
                        <p className="text-2xl font-bold">{statsLast7Days.medications.count}</p>
                        <p className="text-sm text-muted-foreground">Outros Medicamentos</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Bike className="h-8 w-8 text-orange-500"/>
                    <div>
                        <p className="text-2xl font-bold">{statsLast7Days.activity.count}</p>
                        <p className="text-sm text-muted-foreground">Atividades Físicas</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Utensils className="h-8 w-8 text-lime-600"/>
                    <div>
                        <p className="text-2xl font-bold">{statsLast7Days.meals.count}</p>
                        <p className="text-sm text-muted-foreground">Refeições Analisadas</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Glicemia Média nos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={last7DaysGlucoseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={['dataMin - 20', 'dataMax + 20']} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="averageGlucose" fill="var(--color-averageGlucose)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-accent/10 border-accent/30">
            <CardHeader>
              <CardTitle className="text-accent-foreground flex items-center"><Lightbulb className="mr-2"/> Dica Personalizada (Exemplo)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                let tip = "Continue monitorando seus níveis para que possamos identificar padrões e tendências.";
                if (recentTrend === 'increasing') {
                  tip = "Percebemos que sua glicemia média aumentou recentemente. ";
                  if (statsLast7Days.activity.count < 2) {
                    tip += "Considerar aumentar a frequência de atividades físicas pode ajudar. ";
                  }
                  if (statsLast7Days.meals.avgCarbs > 60) {
                    tip += "A média de carboidratos nas suas refeições analisadas está um pouco alta, avalie se é possível ajustá-la. ";
                  } else {
                     tip += "Verifique se sua dosagem de insulina e medicamentos está adequada ou se houve mudanças na dieta. ";
                  }
                  tip += "Se persistir, consulte seu médico.";
                } else if (recentTrend === 'decreasing') {
                  tip = "Sua glicemia média tem diminuído. Isso pode ser positivo, mas fique atento(a) a possíveis hipoglicemias. ";
                  tip += "Certifique-se que suas doses de insulina e medicamentos não estão causando quedas bruscas.";
                } else if (recentTrend === 'stable') {
                   tip = "Seus níveis de glicose parecem estáveis. ";
                   if(statsLast7Days.activity.count > 2){
                     tip += `Suas ${statsLast7Days.activity.count} atividades físicas na semana parecem estar contribuindo! `
                   }
                   tip += "Excelente trabalho, continue com sua rotina atual de monitoramento, alimentação e exercícios!"
                }
                
                return <p className="text-accent-foreground/90">{tip}</p>;
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
