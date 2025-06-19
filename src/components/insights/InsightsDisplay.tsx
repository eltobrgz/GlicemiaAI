
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GlucoseReading } from '@/types';
import { getGlucoseReadings } from '@/lib/storage'; // Now async
import { BarChart3, Lightbulb, TrendingUp, TrendingDown, Activity, CheckCircle, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';


export default function InsightsDisplay() {
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReadings = async () => {
      setIsLoading(true);
      try {
        const readings = await getGlucoseReadings();
        setGlucoseReadings(readings);
      } catch (error: any) {
        toast({ title: "Erro ao buscar dados para insights", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReadings();
  }, [toast]);

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
    if (glucoseReadings.length < 2) return null; // Need at least some data for trend
    
    const readingsSorted = [...glucoseReadings].sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
    const last7DaysReadings = readingsSorted.filter(r => parseISO(r.timestamp) > subDays(new Date(), 7));
    
    if(last7DaysReadings.length < 2) return 'stable'; // Not enough recent data for a strong trend

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
    return 'stable'; // Default to stable if not enough comparative data
  }, [glucoseReadings]);


  const last7DaysData = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-primary/10 border-primary/30 text-primary-foreground">
         <Lightbulb className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Análise da IA (Simplificada)</AlertTitle>
        <AlertDescription className="text-primary/90">
          Esta seção apresenta uma análise básica dos seus dados de glicemia. Uma IA mais avançada poderia identificar padrões complexos, prever tendências e fornecer dicas ainda mais personalizadas.
        </AlertDescription>
      </Alert>

      {glucoseReadings.length < 5 && (
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Mais Dados Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Continue registrando seus dados de glicemia (pelo menos 5 registros) para obter insights mais detalhados.</p>
          </CardContent>
        </Card>
      )}

      {glucoseReadings.length >= 5 && (
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
                <p className="text-xs text-muted-foreground">Média de todos os registros</p>
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
                <p className="text-xs text-muted-foreground">Percentual de leituras dentro da meta</p>
              </CardContent>
            </Card>
             <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tendência Recente (Últ. 7 dias)</CardTitle>
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
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Glicemia Média nos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={last7DaysData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
              {recentTrend === 'increasing' && (
                <p className="text-accent-foreground/90">"Percebemos que sua glicemia média aumentou recentemente. Considere revisar sua alimentação ou nível de atividade física. Se persistir, consulte seu médico."</p>
              )}
              {recentTrend === 'decreasing' && (
                <p className="text-accent-foreground/90">"Sua glicemia média tem diminuído. Isso pode ser positivo, mas fique atento(a) a possíveis hipoglicemias. Mantenha sua rotina e monitore."</p>
              )}
              {recentTrend === 'stable' && (
                 <p className="text-accent-foreground/90">"Seus níveis de glicose parecem estáveis. Continue com sua rotina atual de alimentação e exercícios!"</p>
              )}
              {!recentTrend && glucoseReadings.length > 0 && (
                 <p className="text-accent-foreground/90">"Continue monitorando sua glicemia para que possamos identificar padrões e tendências."</p>
              )}
               {glucoseReadings.length === 0 && !isLoading && (
                 <p className="text-accent-foreground/90">"Registre seus dados para receber dicas personalizadas."</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
