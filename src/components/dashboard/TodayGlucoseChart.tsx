
'use client';

import type { GlucoseReading, UserProfile } from '@/types';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, DotProps } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getGlucoseLevelColor } from '@/lib/utils';
import { cn } from '@/lib/utils';


interface TodayGlucoseChartProps {
  readings: GlucoseReading[];
  userProfile: UserProfile;
}

// Custom Dot component
const CustomizedDot = (props: any) => {
  const { cx, cy, payload, userProfile } = props;
  
  if (!payload || typeof payload.glicemia !== 'number') {
    return null;
  }

  const level = payload.level;
  const colorClass = getGlucoseLevelColor(level, userProfile);
  
  // Extracting the raw color from the class for the SVG fill
  let fillColor = 'hsl(var(--primary))'; // Default
  if (colorClass.includes('blue')) fillColor = '#3b82f6';
  if (colorClass.includes('green')) fillColor = '#22c55e';
  if (colorClass.includes('yellow')) fillColor = '#eab308';
  if (colorClass.includes('red')) fillColor = '#ef4444';

  return (
    <svg x={cx - 8} y={cy - 8} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" fill={fillColor} stroke="hsl(var(--background))" strokeWidth="2" />
    </svg>
  );
};


export default function TodayGlucoseChart({ readings, userProfile }: TodayGlucoseChartProps) {

  const chartData = useMemo(() => {
    return readings.map(r => ({
      time: parseISO(r.timestamp),
      glicemia: r.value,
      level: r.level, // Pass level to chart data
    }));
  }, [readings]);

  if (readings.length < 2) {
    return (
      <div className="flex items-center justify-center h-[350px] text-center text-muted-foreground p-4">
        <p>São necessários pelo menos 2 registros nas últimas 24h para exibir o gráfico de tendência.</p>
      </div>
    );
  }

  const yDomain = useMemo(() => {
    const values = readings.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const buffer = 20;
    return [Math.max(0, min - buffer), max + buffer];
  }, [readings]);


  return (
    <div className="h-[350px]">
        <ChartContainer config={{}} className="w-full h-full">
            <ResponsiveContainer>
                <AreaChart
                data={chartData}
                margin={{
                    top: 5,
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
                                    <span className={cn("font-bold text-lg", getGlucoseLevelColor(props.payload.level, userProfile))}>{value}</span>
                                    <span className="text-muted-foreground ml-1.5">mg/dL</span>
                                </div>
                            )}
                            labelFormatter={(label) => format(new Date(label), "dd/MM HH:mm", {locale: ptBR})}
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                    }
                />
                {userProfile.target_glucose_high && (
                    <ReferenceLine y={userProfile.target_glucose_high} label={{ value: `Hiper (${userProfile.target_glucose_high})`, position: 'insideTopRight', fill: 'hsl(var(--destructive) / 0.8)', fontSize: 12 }} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                )}
                 {userProfile.target_glucose_low && (
                    <ReferenceLine y={userProfile.target_glucose_low} label={{ value: `Hipo (${userProfile.target_glucose_low})`, position: 'insideBottomRight', fill: 'hsl(var(--chart-2) / 0.9)', fontSize: 12 }} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" />
                )}
                
                <Area type="monotone" dataKey="glicemia" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorGlicemia)" />

                <Line
                    type="monotone"
                    dataKey="glicemia"
                    stroke="transparent" // A linha em si é invisível, só queremos os pontos
                    dot={<CustomizedDot userProfile={userProfile} />}
                    activeDot={false}
                />
                </AreaChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
