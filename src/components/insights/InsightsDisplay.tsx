
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GlucoseReading, InsulinLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs } from '@/lib/storage';
import { BarChart3, Lightbulb, TrendingUp, TrendingDown, Activity, CheckCircle, Loader2, Pill } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';


export default function InsightsDisplay() {
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [insulinLogs, setInsulinLogs] = useState<InsulinLog[]>([]);
  const [isLoadingGlucose, setIsLoadingGlucose] = useState(true);
  const [isLoadingInsulin, setIsLoadingInsulin] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingGlucose(true);
      setIsLoadingInsulin(true);
      try {
        const [fetchedGlucoseReadings, fetchedInsulinLogs] = await Promise.all([
          getGlucoseReadings(),
          getInsulinLogs()
        ]);
        setGlucoseReadings(fetchedGlucoseReadings);
        setInsulinLogs(fetchedInsulinLogs);
      } catch (error: any) {
        toast({ title: "Erro ao buscar dados para insights", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingGlucose(false);
        setIsLoadingInsulin(false);
      }
    };
    fetchData();
  }, [toast]);

  const isLoading = isLoadingGlucose || isLoadingInsulin;

  const averageGlucose = useMemo(() => {
    if (glucoseReadings.length === 0) return null;
    const sum = glucoseReadings.reduce((acc, r) => acc + r.value, 0);
    return sum / glucoseReadings.length;
  }, [glucoseReadings]);

  const timeInTarget = useMemo(() => {
    if (glucoseReadings.length === 0) return null;
    const targetMin = 70;
    const targetMax = 180;
    const inTargetCount = glucoseReadings.filter(r => r.value >= targetMin && r.value <= targetMax).length;
    return (inTargetCount / glucoseReadings.length) * 100;
  }, [glucoseReadings]);

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
  const hasEnoughInsulinData = insulinLogs.length >=1; // Example threshold, can be adjusted

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
         <Lightbulb className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Análise da IA (Simplificada)</AlertTitle>
        <AlertDescription className="text-primary/90">
          Esta seção apresenta uma análise básica dos seus dados de glicemia e insulina. Uma IA mais avançada poderia identificar padrões complexos, prever tendências e fornecer dicas ainda mais personalizadas.
        </AlertDescription>
      </Alert>

      {(!hasEnoughGlucoseData || !hasEnoughInsulinData) && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Mais Dados Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Continue registrando seus dados 
              {!hasEnoughGlucoseData && " de glicemia (pelo menos 5 registros)"}
              {!hasEnoughGlucoseData && !hasEnoughInsulinData && " e "}
              {!hasEnoughInsulinData && " de insulina (pelo menos 1 registro)"}
              {' '}para obter insights mais detalhados.
            </p>
          </CardContent>
        </Card>
      )}

      {(hasEnoughGlucoseData || hasEnoughInsulinData) && (
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
                    <CardTitle className="text-sm font-medium">Tempo no Alvo (70-180 mg/dL)</CardTitle>
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
                  if (hasEnoughInsulinData && insulinStatsLast7Days.administrations < 3 && insulinStatsLast7Days.totalDose < 20) { // Example condition
                     tip += "Seus registros de insulina parecem baixos. Considere revisar sua rotina de aplicação ou alimentação. ";
                  } else if (hasEnoughInsulinData) {
                     tip += "Verifique se sua dosagem de insulina está adequada ou se houve mudanças na dieta/atividade. ";
                  } else {
                     tip += "Considere revisar sua alimentação ou nível de atividade física. ";
                  }
                  tip += "Se persistir, consulte seu médico.";
                } else if (hasEnoughGlucoseData && recentTrend === 'decreasing') {
                  tip = "Sua glicemia média tem diminuído. Isso pode ser positivo, mas fique atento(a) a possíveis hipoglicemias. ";
                   if (hasEnoughInsulinData && insulinStatsLast7Days.administrations > 7 && insulinStatsLast7Days.totalDose > 50) { // Example condition
                     tip += "Suas doses de insulina parecem frequentes. Certifique-se que não está causando hipoglicemias. ";
                  }
                  tip += "Mantenha sua rotina e monitore.";
                } else if (hasEnoughGlucoseData && recentTrend === 'stable') {
                   tip = "Seus níveis de glicose parecem estáveis. ";
                   if (hasEnoughInsulinData) {
                     tip += `Você registrou ${insulinStatsLast7Days.administrations} aplicações de insulina nos últimos 7 dias. `
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


    