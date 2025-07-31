
'use client';

import type { GlucoseReading, UserProfile } from '@/types';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { GLUCOSE_THRESHOLDS } from '@/config/constants';

interface TodayGlucoseChartProps {
  readings: GlucoseReading[];
  userProfile: UserProfile;
}

// Custom Dot component refatorado para ser mais robusto
const GlucoseLevelDot = (props: any) => {
  const { cx, cy, payload, userProfile } = props;

  if (!payload || typeof payload.glicemia !== 'number') {
    return null;
  }
  
  // Mapeia o nível diretamente para uma cor HSL, mais confiável que classes CSS.
  const getColorForLevel = (level?: GlucoseReading['level']): string => {
    switch (level) {
      case 'baixa':       return 'hsl(var(--chart-2))'; // Azul/Teal
      case 'normal':      return 'hsl(var(--chart-5))'; // Verde
      case 'alta':        return 'hsl(var(--chart-4))'; // Amarelo/Laranja
      case 'muito_alta':  return 'hsl(var(--destructive))'; // Vermelho
      default:            return 'hsl(var(--primary))';
    }
  };

  const fillColor = getColorForLevel(payload.level);

  return (
    <svg x={cx - 8} y={cy - 8} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" fill={fillColor} stroke="hsl(var(--background))" strokeWidth="2" />
    </svg>
  );
};


export default function TodayGlucoseChart({ readings, userProfile }: TodayGlucoseChartProps) {

  const chartData = useMemo(() => {
    const dataMap = new Map<number, { time: number; glicemia: number; level: GlucoseReading['level'] }>();
    
    readings.forEach(r => {
      const time = parseISO(r.timestamp).getTime();
      // If a reading with the same timestamp already exists, this will overwrite it.
      // Since the data is sorted, this is acceptable for this chart's purpose.
      dataMap.set(time, {
        time: time,
        glicemia: r.value,
        level: r.level,
      });
    });

    return Array.from(dataMap.values());
  }, [readings]);


  const yDomain = useMemo(() => {
    if (readings.length === 0) return [40, 200]; // Domínio padrão se não houver dados
    const values = readings.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const buffer = 20;
    // Garante que o eixo Y comece um pouco abaixo do mínimo e vá um pouco acima do máximo.
    return [Math.max(0, min - buffer), max + buffer];
  }, [readings]);


  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-[350px] text-center text-muted-foreground p-4">
        <p>São necessários pelo menos 2 registros nas últimas 24h para exibir o gráfico de tendência.</p>
      </div>
    );
  }
  
  const targetHigh = userProfile.target_glucose_high ?? GLUCOSE_THRESHOLDS.normalIdealMax;
  const targetLow = userProfile.target_glucose_low ?? GLUCOSE_THRESHOLDS.low;

  return (
    <div className="h-[350px]">
        <ChartContainer config={{}} className="w-full h-full">
            <ResponsiveContainer>
                <AreaChart
                data={chartData}
                margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 5,
                }}
                >
                <defs>
                    <linearGradient id="colorGlicemia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                    dataKey="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
                    scale="time"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                    domain={yDomain} 
                    allowDataOverflow 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                    content={
                        <ChartTooltipContent 
                            formatter={(value, name, props) => (
                                <div className="flex items-center">
                                    <span className={cn("font-bold text-lg")}>{value}</span>
                                    <span className="text-muted-foreground ml-1.5">mg/dL</span>
                                </div>
                            )}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0 && payload[0].payload.time) {
                                  return format(new Date(payload[0].payload.time), "dd/MM HH:mm", {locale: ptBR});
                                }
                                return label;
                            }}
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                    }
                />
                <ReferenceLine y={targetHigh} label={{ value: `Hiper (${targetHigh})`, position: 'insideTopRight', fill: 'hsl(var(--destructive) / 0.8)', fontSize: 12 }} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                <ReferenceLine y={targetLow} label={{ value: `Hipo (${targetLow})`, position: 'insideBottomRight', fill: 'hsl(var(--chart-2) / 0.9)', fontSize: 12 }} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" />
                
                <Area 
                    type="monotone" 
                    dataKey="glicemia" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5} 
                    fill="url(#colorGlicemia)" 
                    dot={<GlucoseLevelDot userProfile={userProfile} />} 
                    activeDot={{ r: 8, strokeWidth: 2 }}
                />

                </AreaChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
