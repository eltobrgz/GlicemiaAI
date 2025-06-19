'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GlucoseReading } from '@/types';
import { getGlucoseReadings }.0from '@/lib/storage';
import { BarChart3, Lightbulb, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';


export default function InsightsDisplay() {
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [averageGlucose, setAverageGlucose] = useState<number | null>(null);
  const [timeInTarget, setTimeInTarget] = useState<number | null>(null); // Percentage
  const [recentTrend, setRecentTrend] = useState<'increasing' | 'decreasing' | 'stable' | null>(null);

  useEffect(() => {
    const readings = getGlucoseReadings();
    setGlucoseReadings(readings);

    if (readings.length > 0) {
      const sum = readings.reduce((acc, r) => acc + r.value, 0);
      setAverageGlucose(sum / readings.length);

      // Example: Time in target (70-180 mg/dL)
      const targetMin = 70;
      const targetMax = 180;
      const inTargetCount = readings.filter(r => r.value >= targetMin && r.value <= targetMax).length;
      setTimeInTarget((inTargetCount / readings.length) * 100);

      // Basic trend analysis (last 7 days vs previous 7 days)
      // This is a very simplified trend analysis. Real AI would be more sophisticated.
      const last7DaysReadings = readings.filter(r => parseISO(r.timestamp) > subDays(new Date(), 7));
      const prev7DaysReadings = readings.filter(r => {
        const date = parseISO(r.timestamp);
        return date <= subDays(new Date(), 7) && date > subDays(new Date(), 14);
      });

      if (last7DaysReadings.length > 0 && prev7DaysReadings.length > 0) {
        const avgLast7 = last7DaysReadings.reduce((acc, r) => acc + r.value, 0) / last7DaysReadings.length;
        const avgPrev7 = prev7DaysReadings.reduce((acc, r) => acc + r.value, 0) / prev7DaysReadings.length;
        if (avgLast7 > avgPrev7 * 1.1) setRecentTrend('increasing'); // 10% increase
        else if (avgLast7 < avgPrev7 * 0.9) setRecentTrend('decreasing'); // 10% decrease
        else setRecentTrend('stable');
      }
    }
  }, []);

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
            <p className="text-muted-foreground">Continue registrando seus dados de glicemia para obter insights mais detalhados.</p>
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
              {glucoseReadings.length === 0 && (
                 <p className="text-accent-foreground/90">"Registre seus dados para receber dicas personalizadas."</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

const CheckCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
