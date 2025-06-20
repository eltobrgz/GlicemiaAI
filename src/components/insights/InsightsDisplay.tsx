
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GlucoseReading, InsulinLog, UserProfile, ActivityLog, MealAnalysis } from '@/types';
import { getGlucoseReadings, getInsulinLogs, getUserProfile, getActivityLogs, getMealAnalyses } from '@/lib/storage';
import { BarChart3, Lightbulb, TrendingUp, TrendingDown, Activity, CheckCircle, Loader2, Pill, Bike, Utensils } from 'lucide-react';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoadingGlucose, setIsLoadingGlucose] = useState(true);
  const [isLoadingInsulin, setIsLoadingInsulin] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingGlucose(true);
      setIsLoadingInsulin(true);
      setIsLoadingProfile(true);
      setIsLoadingActivity(true);
      setIsLoadingMeals(true);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        setIsLoadingProfile(false);

        const [
          fetchedGlucoseReadings, 
          fetchedInsulinLogs, 
          fetchedActivityLogs,
          fetchedMealAnalyses
        ] = await Promise.all([
          getGlucoseReadings(profile),
          getInsulinLogs(),
          getActivityLogs(),
          getMealAnalyses()
        ]);
        setGlucoseReadings(fetchedGlucoseReadings);
        setInsulinLogs(fetchedInsulinLogs);
        setActivityLogs(fetchedActivityLogs);
        setMealAnalyses(fetchedMealAnalyses);

      } catch (error: any) {
        toast({ title: "Erro ao buscar dados para insights", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingGlucose(false);
        setIsLoadingInsulin(false);
        setIsLoadingActivity(false);
        setIsLoadingMeals(false);
      }
    };
    fetchData();
  }, [toast]);

  const isLoading = isLoadingGlucose || isLoadingInsulin || isLoadingProfile || isLoadingActivity || isLoadingMeals;

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

  const insulinStatsLast7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    const recentLogs = insulinLogs.filter(log => parseISO(log.timestamp) >= sevenDaysAgo);
    
    const totalDose = recentLogs.reduce((sum, log) => sum + log.dose, 0);
    const administrations = recentLogs.length;
    
    return {
      totalDose: parseFloat(totalDose.toFixed(1)),
      administrations,
    };
  }, [insulinLogs]);

  const activityStatsLast7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    const recentLogs = activityLogs.filter(log => parseISO(log.timestamp) >= sevenDaysAgo);
    const count = recentLogs.length;
    const totalDurationMinutes = recentLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
    return { count, totalDurationMinutes };
  }, [activityLogs]);

  const mealStatsLast7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    const recentAnalyses = mealAnalyses.filter(analysis => parseISO(analysis.timestamp) >= sevenDaysAgo);
    const count = recentAnalyses.length;
    if (count === 0) return { count, avgCarbs: 0, avgProtein: 0, avgFat: 0 };

    const totalCarbs = recentAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.carbohydrates, 0);
    const totalProtein = recentAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.protein, 0);
    const totalFat = recentAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.fat, 0);
    return {
      count,
      avgCarbs: totalCarbs / count,
      avgProtein: totalProtein / count,
      avgFat: totalFat / count,
    };
  }, [mealAnalyses]);


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

  const hasEnoughGlucoseData = glucoseReadings.length >= 5;
  const hasEnoughInsulinData = insulinLogs.length >=1; 
  const hasEnoughActivityData = activityLogs.length >=1;
  const hasEnoughMealData = mealAnalyses.length >=1;

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
         <Lightbulb className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Análise da IA (Simplificada)</AlertTitle>
        <AlertDescription className="text-primary/90">
          Esta seção apresenta uma análise básica dos seus dados de glicemia e insulina. Uma IA mais avançada poderia identificar padrões complexos, prever tendências e fornecer dicas ainda mais personalizadas. As faixas de referência usadas aqui são: Baixa (&lt;{currentGlucoseTargets.low}), Normal ({currentGlucoseTargets.normalIdealMin}-{currentGlucoseTargets.normalIdealMax}), Alta (&gt;{currentGlucoseTargets.normalIdealMax} e &lt;={currentGlucoseTargets.high}), Muito Alta (&gt;{currentGlucoseTargets.high}).
        </AlertDescription>
      </Alert>

      {(!hasEnoughGlucoseData || !hasEnoughInsulinData || !hasEnoughActivityData || !hasEnoughMealData) && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Mais Dados Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Continue registrando seus dados 
              {!hasEnoughGlucoseData && " de glicemia (pelo menos 5 registros)"}
              {(!hasEnoughGlucoseData && (!hasEnoughInsulinData || !hasEnoughActivityData || !hasEnoughMealData)) && ", "}
              {!hasEnoughInsulinData && " de insulina (pelo menos 1 registro)"}
              {(!hasEnoughInsulinData && (!hasEnoughActivityData || !hasEnoughMealData) && (hasEnoughGlucoseData)) && ", "}
              {!hasEnoughActivityData && " de atividade (pelo menos 1 registro)"}
              {(!hasEnoughActivityData && !hasEnoughMealData && (hasEnoughInsulinData || hasEnoughGlucoseData)) && ", "}
              {!hasEnoughMealData && " de análise de refeição (pelo menos 1 registro)"}
              {' '}para obter insights mais detalhados.
            </p>
          </CardContent>
        </Card>
      )}

      {(hasEnoughGlucoseData || hasEnoughInsulinData || hasEnoughActivityData || hasEnoughMealData) && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hasEnoughGlucoseData && (
              <>
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
                    <p className="text-xs text-muted-foreground">Percentual de leituras de glicemia na meta</p>
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
              </>
            )}
            {hasEnoughInsulinData && (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Administrações de Insulina</CardTitle>
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">
                      {insulinStatsLast7Days.administrations}
                    </div>
                    <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dose Total de Insulina</CardTitle>
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">
                      {insulinStatsLast7Days.totalDose} <span className="text-lg text-muted-foreground">unidades</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
                  </CardContent>
                </Card>
              </>
            )}
             {hasEnoughActivityData && (
              <>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atividades Físicas</CardTitle>
                    <Bike className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">
                      {activityStatsLast7Days.count}
                    </div>
                    <p className="text-xs text-muted-foreground">Sessões nos últimos 7 dias</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Duração Total de Atividades</CardTitle>
                    <Bike className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">
                      {activityStatsLast7Days.totalDurationMinutes} <span className="text-lg text-muted-foreground">min</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
                  </CardContent>
                </Card>
              </>
            )}
            {hasEnoughMealData && (
                <>
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Refeições Analisadas</CardTitle>
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-lime-600">
                                {mealStatsLast7Days.count}
                            </div>
                            <p className="text-xs text-muted-foreground">Nos últimos 7 dias</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Média de Carboidratos</CardTitle>
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-lime-600">
                                {mealStatsLast7Days.avgCarbs.toFixed(1)} <span className="text-lg text-muted-foreground">g/refeição</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Média das refeições analisadas (últ. 7 dias)</p>
                        </CardContent>
                    </Card>
                </>
            )}
          </div>
          
          {hasEnoughGlucoseData && (
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
          )}

          <Card className="shadow-md bg-accent/10 border-accent/30">
            <CardHeader>
              <CardTitle className="text-accent-foreground flex items-center"><Lightbulb className="mr-2"/> Dica Personalizada (Exemplo)</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                let tip = "Continue monitorando seus níveis de glicemia e insulina para que possamos identificar padrões e tendências.";
                if (hasEnoughGlucoseData && recentTrend === 'increasing') {
                  tip = "Percebemos que sua glicemia média aumentou recentemente. ";
                  if (hasEnoughActivityData && activityStatsLast7Days.count < 2) {
                    tip += "Considerar aumentar a frequência ou intensidade das atividades físicas pode ajudar. ";
                  }
                  if (hasEnoughMealData && mealStatsLast7Days.avgCarbs > 60) {
                    tip += "A média de carboidratos nas suas refeições analisadas está um pouco alta, avalie se é possível ajustá-la. "
                  }
                  if (hasEnoughInsulinData && insulinStatsLast7Days.administrations < 3 && insulinStatsLast7Days.totalDose < 20) { 
                     tip += "Seus registros de insulina parecem baixos. Considere revisar sua rotina de aplicação ou alimentação. ";
                  } else if (hasEnoughInsulinData) {
                     tip += "Verifique se sua dosagem de insulina está adequada ou se houve mudanças na dieta/atividade. ";
                  }
                  tip += "Se persistir, consulte seu médico.";
                } else if (hasEnoughGlucoseData && recentTrend === 'decreasing') {
                  tip = "Sua glicemia média tem diminuído. Isso pode ser positivo, mas fique atento(a) a possíveis hipoglicemias. ";
                   if (hasEnoughInsulinData && insulinStatsLast7Days.administrations > 7 && insulinStatsLast7Days.totalDose > 50) { 
                     tip += "Suas doses de insulina parecem frequentes. Certifique-se que não está causando hipoglicemias. ";
                  }
                  tip += "Mantenha sua rotina e monitore.";
                } else if (hasEnoughGlucoseData && recentTrend === 'stable') {
                   tip = "Seus níveis de glicose parecem estáveis. ";
                   if (hasEnoughInsulinData) {
                     tip += `Você registrou ${insulinStatsLast7Days.administrations} aplicações de insulina nos últimos 7 dias. `
                   }
                   if(hasEnoughActivityData && activityStatsLast7Days.count > 2){
                     tip += `Suas ${activityStatsLast7Days.count} atividades físicas na semana parecem estar contribuindo! `
                   }
                   tip += "Continue com sua rotina atual de monitoramento, alimentação e exercícios!"
                }
                
                if (!hasEnoughGlucoseData && !hasEnoughInsulinData && !isLoading) {
                   tip = "Registre seus dados de glicemia e insulina para receber dicas personalizadas."
                } else if (!hasEnoughGlucoseData && !isLoading) {
                   tip = "Registre seus dados de glicemia para receber dicas mais completas sobre seus níveis."
                } else if (!hasEnoughInsulinData && !isLoading) {
                   tip = "Registre seus dados de insulina para que as dicas possam considerar sua terapia."
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

