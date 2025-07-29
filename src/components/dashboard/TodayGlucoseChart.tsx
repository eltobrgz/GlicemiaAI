
'use client';

import type { GlucoseReading, UserProfile } from '@/types';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface TodayGlucoseChartProps {
  readings: GlucoseReading[];
  userProfile: UserProfile;
}

export default function TodayGlucoseChart({ readings, userProfile }: TodayGlucoseChartProps) {

  const chartData = useMemo(() => {
    return readings.map(r => ({
      time: parseISO(r.timestamp),
      glicemia: r.value,
    }));
  }, [readings]);

  if (readings.length < 2) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        <p>São necessários pelo menos 2 registros nas últimas 24h para exibir o gráfico.</p>
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
                <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 0,
                    bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
                    scale="time"
                />
                <YAxis domain={yDomain} allowDataOverflow />
                <Tooltip
                    content={
                        <ChartTooltipContent 
                            formatter={(value) => `${value} mg/dL`}
                            labelFormatter={(label) => format(new Date(label), "dd/MM HH:mm", {locale: ptBR})}
                        />
                    }
                />
                {userProfile.target_glucose_high && (
                    <ReferenceLine y={userProfile.target_glucose_high} label={{ value: `Hiper (${userProfile.target_glucose_high})`, position: 'insideTopRight', fill: 'hsl(var(--destructive))', fontSize: 12 }} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                )}
                 {userProfile.target_glucose_low && (
                    <ReferenceLine y={userProfile.target_glucose_low} label={{ value: `Hipo (${userProfile.target_glucose_low})`, position: 'insideBottomRight', fill: 'hsl(var(--chart-2))', fontSize: 12 }} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                )}
                <Line type="monotone" dataKey="glicemia" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

    