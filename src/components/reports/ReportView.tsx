
'use client';

import type { GlucoseReading, InsulinLog, UserProfile, ActivityLog, MealAnalysis, MedicationLog } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToDot, ArrowUpFromDot, TrendingUp, Activity, Syringe, Percent, BarChartBig, PieChartIcon, Info, Bike, Utensils, Calculator, FileSpreadsheet, ClipboardPlus } from 'lucide-react';
import { getGlucoseLevelColor, formatDateTime } from '@/lib/utils';
import { GLUCOSE_THRESHOLDS } from '@/config/constants';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


export interface ReportData {
  period: { start: Date; end: Date };
  glucoseReadings: GlucoseReading[];
  insulinLogs: InsulinLog[];
  activityLogs: ActivityLog[];
  mealAnalyses: MealAnalysis[];
  medicationLogs: MedicationLog[];
  userProfile: UserProfile;
  summary: {
    averageGlucose: number | null;
    minGlucose: { value: number; timestamp: string } | null;
    maxGlucose: { value: number; timestamp: string } | null;
    stdDevGlucose: number | null;
    glucoseCV: number | null;
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
    totalActivities: number;
    totalActivityDuration: number | null;
    averageActivityDuration: number | null;
    totalMealAnalyses: number;
    averageMealCarbs: number | null;
    averageMealProtein: number | null;
    averageMealFat: number | null;
    totalMedications: number;
  };
}

interface ReportViewProps {
  data: ReportData;
}

const COLORS_PIE = {
  below: 'hsl(var(--chart-2))', // accent (teal)
  inRange: 'hsl(var(--chart-5))', // green
  above: 'hsl(var(--chart-4))', // orange/yellow
};

const pieChartConfig = {
  value: {
    label: 'Percentual',
  },
  'Abaixo do Alvo': {
    label: 'Abaixo do Alvo',
    color: COLORS_PIE.below,
  },
  'No Alvo': {
    label: 'No Alvo',
    color: COLORS_PIE.inRange,
  },
  'Acima do Alvo': {
    label: 'Acima do Alvo',
    color: COLORS_PIE.above,
  },
} satisfies ChartConfig

const SummaryMetric: React.FC<{ title: string; value: string | number | null; unit?: string; description?: string; }> = ({ title, value, unit, description }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{title}</p>
    <div className="text-2xl font-bold">
      {value !== null && value !== undefined ? value : 'N/A'}
      {unit && value !== null && value !== undefined && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);


export default function ReportView({ data }: ReportViewProps) {
  const { period, glucoseReadings, insulinLogs, activityLogs, mealAnalyses, medicationLogs, userProfile, summary } = data;

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
  }, [glucoseReadings, period.start, period.end]);

  const timeInRangeData = useMemo(() => {
    if (summary.timeBelowTargetPercent === null && summary.timeInTargetPercent === null && summary.timeAboveTargetPercent === null) return [];
    return [
      { name: 'Abaixo do Alvo', value: summary.timeBelowTargetPercent ?? 0, color: COLORS_PIE.below },
      { name: 'No Alvo', value: summary.timeInTargetPercent ?? 0, color: COLORS_PIE.inRange },
      { name: 'Acima do Alvo', value: summary.timeAboveTargetPercent ?? 0, color: COLORS_PIE.above },
    ].filter(item => item.value > 0);
  }, [summary.timeBelowTargetPercent, summary.timeInTargetPercent, summary.timeAboveTargetPercent]);


  const glucoseChartConfig = {
    glicemia: { label: 'Glicemia (mg/dL)', color: 'hsl(var(--primary))' },
  };
  const insulinChartConfig = {
    dose: { label: 'Dose Insulina (U)', color: 'hsl(var(--accent))' },
  };
   const activityChartConfig = {
    duration: { label: 'Duração Atividade (min)', color: 'hsl(var(--chart-4))' }, // orange
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
  }, [insulinLogs, period.start, period.end]);

  const activityTrendData = useMemo(() => {
    if (!activityLogs || activityLogs.length === 0) return [];
    const daysInPeriod = eachDayOfInterval({ start: period.start, end: period.end });
    return daysInPeriod.map(day => {
      const logsForDay = activityLogs.filter(log => isSameDay(parseISO(log.timestamp), day));
      const totalDuration = logsForDay.reduce((sum, log) => sum + log.duration_minutes, 0);
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        duration: totalDuration > 0 ? totalDuration : null,
      };
    }).filter(d => d.duration !== null);
  }, [activityLogs, period.start, period.end]);
  
  const hasData = glucoseReadings.length > 0 || insulinLogs.length > 0 || activityLogs.length > 0 || mealAnalyses.length > 0 || medicationLogs.length > 0;

  if (!hasData) {
    return (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Info className="mx-auto h-12 w-12 mb-4" />
            Nenhum dado encontrado para o período selecionado.
            <br/>
            Por favor, registre seus dados ou selecione um período diferente.
          </CardContent>
        </Card>
    )
  }


  return (
    <div className="space-y-6 p-4 sm:p-6 bg-background text-foreground">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary">
            Relatório de Acompanhamento
          </CardTitle>
          <CardDescription>
            Período: {format(period.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(period.end, 'dd/MM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-6">
        {/* Glucose Section */}
        {glucoseReadings.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Resumo Glicêmico</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <SummaryMetric title="Glicemia Média" value={summary.averageGlucose?.toFixed(1)} unit="mg/dL" />
              <SummaryMetric title="Glicemia Mínima" value={summary.minGlucose?.value} unit="mg/dL" description={summary.minGlucose ? `Em ${format(parseISO(summary.minGlucose.timestamp), 'dd/MM HH:mm')}` : ''} />
              <SummaryMetric title="Glicemia Máxima" value={summary.maxGlucose?.value} unit="mg/dL" description={summary.maxGlucose ? `Em ${format(parseISO(summary.maxGlucose.timestamp), 'dd/MM HH:mm')}` : ''} />
              <SummaryMetric title="Desvio Padrão" value={summary.stdDevGlucose?.toFixed(1)} unit="mg/dL" description="Variabilidade" />
              <SummaryMetric title="CV (Variabilidade)" value={summary.glucoseCV?.toFixed(1)} unit="%" description="Ideal < 36%" />
            </CardContent>
          </Card>
        )}

        {timeInRangeData.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Tempo nos Alvos Glicêmicos</CardTitle>
              <CardDescription>
                Alvo Normal definido como {userProfile.target_glucose_low || GLUCOSE_THRESHOLDS.low} - {userProfile.target_glucose_high || GLUCOSE_THRESHOLDS.normalIdealMax} mg/dL
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-[300px] flex justify-center items-center recharts-responsive-container">
                <ChartContainer config={pieChartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={timeInRangeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                      >
                        {timeInRangeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="space-y-4">
                  <div className="border-t pt-4 mt-4 md:border-none md:pt-0">
                     <p className="font-semibold text-lg">Contagem de Eventos:</p>
                     <p>Abaixo do Alvo: <span className="font-bold">{summary.countHypo}</span></p>
                     <p>No Alvo: <span className="font-bold">{summary.countNormal}</span></p>
                     <p>Acima do Alvo: <span className="font-bold">{summary.countHigh}</span></p>
                     <p>Muito Acima do Alvo: <span className="font-bold">{summary.countVeryHigh}</span></p>
                  </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Other Summaries */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insulinLogs.length > 0 && (
            <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><Syringe className="mr-2 h-5 w-5 text-accent"/>Resumo de Insulina</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <SummaryMetric title="Total Administrado" value={summary.totalInsulin?.toFixed(1)} unit="U"/>
                    <SummaryMetric title="Aplicações" value={summary.insulinApplications}/>
                    <SummaryMetric title="Média Diária" value={summary.averageDailyInsulin?.toFixed(1)} unit="U/dia" />
                </CardContent>
            </Card>
            )}
            {medicationLogs.length > 0 && (
            <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><ClipboardPlus className="mr-2 h-5 w-5 text-purple-600"/>Resumo de Medicamentos</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                    <SummaryMetric title="Total de Registros" value={summary.totalMedications} />
                </CardContent>
            </Card>
            )}
            {(activityLogs.length > 0 || mealAnalyses.length > 0) && (
            <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center"><Bike className="mr-2 h-5 w-5 text-orange-500"/><Utensils className="mr-2 h-5 w-5 text-lime-600"/>Resumo de Atividades e Refeições</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <SummaryMetric title="Atividades" value={summary.totalActivities}/>
                    <SummaryMetric title="Duração Total Ativ." value={summary.totalActivityDuration} unit="min"/>
                    <SummaryMetric title="Refeições Analisadas" value={summary.totalMealAnalyses}/>
                    <SummaryMetric title="Média Carbs/Refeição" value={summary.averageMealCarbs?.toFixed(1)} unit="g"/>
                </CardContent>
            </Card>
            )}
        </div>
      </div>


      {/* Charts Section */}
      <div className="space-y-6 mt-6">
        {glucoseReadings.length > 1 && (
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" />Tendência da Glicemia (Média Diária)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pr-6 recharts-responsive-container">
                <ChartContainer config={glucoseChartConfig} className="w-full h-full">
                <LineChart data={glucoseTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={['dataMin - 20', 'dataMax + 20']} allowDataOverflow />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="glicemia" stroke="var(--color-glicemia)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-glicemia)' }} activeDot={{ r: 6 }} connectNulls={false} />
                </LineChart>
                </ChartContainer>
            </CardContent>
            </Card>
        )}
        <div className="grid md:grid-cols-2 gap-6">
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
            
            {activityLogs.length > 0 && (
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><Bike className="mr-2 h-5 w-5 text-orange-500" />Duração Total de Atividade Física Diária</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] pr-6 recharts-responsive-container">
                    <ChartContainer config={activityChartConfig} className="w-full h-full">
                    <BarChart data={activityTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'dataMax + 20']} unit=" min" allowDataOverflow />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="duration" fill="var(--color-duration)" radius={[4, 4, 0, 0]} name="Duração" unit=" min" />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
                </Card>
            )}
        </div>
      </div>
      
      {/* Detailed Logs Section */}
      <Card className="shadow-lg mt-6">
          <CardHeader>
              <CardTitle className="flex items-center"><FileSpreadsheet className="mr-2 h-5 w-5 text-primary"/>Registros Detalhados</CardTitle>
              <CardDescription>Todos os registros individuais do período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="glucose">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="glucose" disabled={glucoseReadings.length === 0}>Glicemia</TabsTrigger>
                    <TabsTrigger value="insulin" disabled={insulinLogs.length === 0}>Insulina</TabsTrigger>
                    <TabsTrigger value="medication" disabled={medicationLogs.length === 0}>Medicamentos</TabsTrigger>
                    <TabsTrigger value="activity" disabled={activityLogs.length === 0}>Atividades</TabsTrigger>
                    <TabsTrigger value="meals" disabled={mealAnalyses.length === 0}>Refeições</TabsTrigger>
                </TabsList>
                <TabsContent value="glucose">
                    <Table>
                        <TableHeader><TableRow><TableHead>Horário</TableHead><TableHead>Valor (mg/dL)</TableHead><TableHead>Contexto</TableHead><TableHead>Nível</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {glucoseReadings.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{formatDateTime(r.timestamp)}</TableCell>
                                    <TableCell className="font-bold">{r.value}</TableCell>
                                    <TableCell>{r.mealContext?.replace('_',' ') || '-'}</TableCell>
                                    <TableCell><Badge variant="outline" className={getGlucoseLevelColor(r.level)}>{r.level || '-'}</Badge></TableCell>
                                    <TableCell>{r.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="insulin">
                     <Table>
                        <TableHeader><TableRow><TableHead>Horário</TableHead><TableHead>Tipo</TableHead><TableHead>Dose (U)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {insulinLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                                    <TableCell>{log.type}</TableCell>
                                    <TableCell className="font-bold">{log.dose}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="medication">
                     <Table>
                        <TableHeader><TableRow><TableHead>Horário</TableHead><TableHead>Medicamento</TableHead><TableHead>Dosagem</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {medicationLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                                    <TableCell>{log.medication_name}</TableCell>
                                    <TableCell>{log.dosage}</TableCell>
                                    <TableCell>{log.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="activity">
                     <Table>
                        <TableHeader><TableRow><TableHead>Horário</TableHead><TableHead>Tipo</TableHead><TableHead>Duração (min)</TableHead><TableHead>Intensidade</TableHead><TableHead>Notas</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {activityLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                                    <TableCell>{log.activity_type.replace('_',' ')}</TableCell>
                                    <TableCell>{log.duration_minutes}</TableCell>
                                    <TableCell>{log.intensity || '-'}</TableCell>
                                    <TableCell>{log.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="meals">
                      <Table>
                        <TableHeader><TableRow><TableHead>Horário</TableHead><TableHead>Identificação</TableHead><TableHead>Carbs (g)</TableHead><TableHead>Prot (g)</TableHead><TableHead>Gord (g)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {mealAnalyses.map(meal => (
                                <TableRow key={meal.id}>
                                    <TableCell>{formatDateTime(meal.timestamp)}</TableCell>
                                    <TableCell>{meal.foodIdentification}</TableCell>
                                    <TableCell>{meal.macronutrientEstimates.carbohydrates.toFixed(1)}</TableCell>
                                    <TableCell>{meal.macronutrientEstimates.protein.toFixed(1)}</TableCell>
                                    <TableCell>{meal.macronutrientEstimates.fat.toFixed(1)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
    </div>
  );
}

    