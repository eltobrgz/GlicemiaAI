
'use client';

import type { GlucoseReading, InsulinLog, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToDot, ArrowUpFromDot, TrendingUp, Activity, Syringe, Percent, BarChartBig, PieChartIcon, Info } from 'lucide-react';
import { getGlucoseLevelColor } from '@/lib/utils';
import { useMemo } from 'react';

export interface ReportData {
  period: { start: Date; end: Date };
  glucoseReadings: GlucoseReading[];
  insulinLogs: InsulinLog[];
  userProfile: UserProfile;
  summary: {
    averageGlucose: number | null;
    minGlucose: { value: number; timestamp: string } | null;
    maxGlucose: { value: number; timestamp: string } | null;
    stdDevGlucose: number | null;
    timeInTargetPercent: number | null;
    timeBelowTargetPercent: number | null;
    timeAboveTargetPercent: number | null;
    countHypo: number;
    countNormal: number;
    countHigh: number;
    countVeryHigh: number;
    totalInsulin: number | null;
    averageDailyInsulin: number | null;
    insulinApplications: number;
  };
}

interface ReportViewProps {
  data: ReportData;
}

const COLORS_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SummaryCard: React.FC<{ title: string; value: string | number | null; unit?: string; description?: string; icon?: React.ElementType; iconColor?: string }> = ({ title, value, unit, description, icon: Icon, iconColor }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className={`h-4 w-4 text-muted-foreground ${iconColor || ''}`} />}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${iconColor || 'text-primary'}`}>
        {value !== null && value !== undefined ? value : 'N/A'}
        {unit && value !== null && value !== undefined && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

export default function ReportView({ data }: ReportViewProps) {
  const { period, glucoseReadings, insulinLogs, userProfile, summary } = data;

  const glucoseTrendData = useMemo(() => {
    if (!glucoseReadings || glucoseReadings.length === 0) return [];
    const daysInPeriod = eachDayOfInterval({ start: period.start, end: period.end });
    return daysInPeriod.map(day => {
      const readingsForDay = glucoseReadings.filter(r => isSameDay(parseISO(r.timestamp), day));
      const avg = readingsForDay.length > 0 ? readingsForDay.reduce((sum, r) => sum + r.value, 0) / readingsForDay.length : null;
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        glicemia: avg !== null ? parseFloat(avg.toFixed(1)) : null,
      };
    }).filter(d => d.glicemia !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glucoseReadings, period.start, period.end]);

  const timeInRangeData = useMemo(() => {
    if (summary.timeBelowTargetPercent === null && summary.timeInTargetPercent === null && summary.timeAboveTargetPercent === null) return [];
    return [
      { name: 'Abaixo do Alvo', value: summary.timeBelowTargetPercent ?? 0, fill: COLORS_PIE[0] },
      { name: 'No Alvo', value: summary.timeInTargetPercent ?? 0, fill: COLORS_PIE[1] },
      { name: 'Acima do Alvo', value: summary.timeAboveTargetPercent ?? 0, fill: COLORS_PIE[2] },
    ].filter(item => item.value > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.timeBelowTargetPercent, summary.timeInTargetPercent, summary.timeAboveTargetPercent]);


  const glucoseChartConfig = {
    glicemia: { label: 'Glicemia (mg/dL)', color: 'hsl(var(--primary))' },
  };
  const insulinChartConfig = {
    dose: { label: 'Dose Insulina (U)', color: 'hsl(var(--accent))' },
  };

  const insulinTrendData = useMemo(() => {
    if (!insulinLogs || insulinLogs.length === 0) return [];
     const daysInPeriod = eachDayOfInterval({ start: period.start, end: period.end });
     return daysInPeriod.map(day => {
      const logsForDay = insulinLogs.filter(log => isSameDay(parseISO(log.timestamp), day));
      const totalDose = logsForDay.reduce((sum, log) => sum + log.dose, 0);
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        dose: totalDose > 0 ? parseFloat(totalDose.toFixed(1)) : null,
      };
    }).filter(d => d.dose !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insulinLogs, period.start, period.end]);


  return (
    <div className="space-y-6 p-4 sm:p-6 bg-background text-foreground">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary">
            Relatório Glicêmico e de Insulina
          </CardTitle>
          <CardDescription>
            Período: {format(period.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(period.end, 'dd/MM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Glicemia Média" value={summary.averageGlucose?.toFixed(1) ?? 'N/A'} unit="mg/dL" icon={Activity} />
        {summary.minGlucose && <SummaryCard title="Glicemia Mínima" value={summary.minGlucose.value} unit="mg/dL" description={`Em ${format(parseISO(summary.minGlucose.timestamp), 'dd/MM HH:mm', { locale: ptBR })}`} icon={ArrowDownToDot} iconColor="text-blue-500" />}
        {summary.maxGlucose && <SummaryCard title="Glicemia Máxima" value={summary.maxGlucose.value} unit="mg/dL" description={`Em ${format(parseISO(summary.maxGlucose.timestamp), 'dd/MM HH:mm', { locale: ptBR })}`} icon={ArrowUpFromDot} iconColor="text-red-500" />}
        <SummaryCard title="Desvio Padrão" value={summary.stdDevGlucose?.toFixed(1) ?? 'N/A'} unit="mg/dL" description="Medida de variabilidade" icon={TrendingUp} />
        <SummaryCard title="Tempo no Alvo" value={summary.timeInTargetPercent?.toFixed(1) ?? 'N/A'} unit="%" description={`${userProfile.target_glucose_low || 'Padrão'}-${userProfile.target_glucose_high || 'Padrão'} mg/dL`} icon={Percent} iconColor="text-green-500" />
        <SummaryCard title="Tempo Abaixo do Alvo" value={summary.timeBelowTargetPercent?.toFixed(1) ?? 'N/A'} unit="%" description={`< ${userProfile.target_glucose_low || userProfile.hypo_glucose_threshold || 'Padrão'} mg/dL`} icon={Percent} iconColor="text-blue-500" />
        <SummaryCard title="Tempo Acima do Alvo" value={summary.timeAboveTargetPercent?.toFixed(1) ?? 'N/A'} unit="%" description={`> ${userProfile.target_glucose_high || 'Padrão'} mg/dL`} icon={Percent} iconColor="text-yellow-500" />
        <SummaryCard title="Cont. Hipoglicemias" value={summary.countHypo} description={`< ${userProfile.hypo_glucose_threshold || GLUCOSE_THRESHOLDS.low} mg/dL`} iconColor="text-blue-500" />
        <SummaryCard title="Cont. Hiperglicemias" value={summary.countHigh + summary.countVeryHigh} description={`> ${userProfile.target_glucose_high || GLUCOSE_THRESHOLDS.normalIdealMax} mg/dL`} iconColor="text-red-500" />

        <SummaryCard title="Total Insulina" value={summary.totalInsulin?.toFixed(1) ?? 'N/A'} unit="U" icon={Syringe} iconColor="text-accent" />
        <SummaryCard title="Média Diária Insulina" value={summary.averageDailyInsulin?.toFixed(1) ?? 'N/A'} unit="U/dia" icon={Syringe} iconColor="text-accent" />
        <SummaryCard title="Aplicações de Insulina" value={summary.insulinApplications} icon={Syringe} iconColor="text-accent" />
      </div>

      {glucoseReadings.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" />Tendência da Glicemia (Média Diária)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pr-6 recharts-responsive-container">
            <ChartContainer config={glucoseChartConfig} className="w-full h-full">
              <LineChart data={glucoseTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={['dataMin - 20', 'dataMax + 20']}
                    allowDataOverflow
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="glicemia" stroke="var(--color-glicemia)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-glicemia)' }} activeDot={{ r: 6 }} connectNulls={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {timeInRangeData.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Distribuição do Tempo nos Alvos Glicêmicos</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex justify-center items-center recharts-responsive-container">
            <ChartContainer config={{}} className="w-full max-w-md h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={timeInRangeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                  >
                    {timeInRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {insulinLogs.length > 0 && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Syringe className="mr-2 h-5 w-5 text-accent" />Dose Total de Insulina Diária</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pr-6 recharts-responsive-container">
             <ChartContainer config={insulinChartConfig} className="w-full h-full">
              <BarChart data={insulinTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'dataMax + 10']} allowDataOverflow />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="dose" fill="var(--color-dose)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {!glucoseReadings.length && !insulinLogs.length && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Info className="mx-auto h-12 w-12 mb-4" />
            Nenhum dado de glicemia ou insulina encontrado para o período selecionado.
            <br/>
            Por favor, registre seus dados ou selecione um período diferente.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
