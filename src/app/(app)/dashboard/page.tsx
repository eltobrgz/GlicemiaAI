'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Pill, Camera, CalendarDays, BellRing, BarChart3, PlusCircle } from 'lucide-react';
import type { GlucoseReading, InsulinLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs } from '@/lib/storage';
import { formatDateTime, classifyGlucoseLevel, getGlucoseLevelColor } from '@/lib/utils';

export default function DashboardPage() {
  const [lastGlucose, setLastGlucose] = useState<GlucoseReading | null>(null);
  const [lastInsulin, setLastInsulin] = useState<InsulinLog | null>(null);

  useEffect(() => {
    const glucoseReadings = getGlucoseReadings();
    if (glucoseReadings.length > 0) {
      setLastGlucose(glucoseReadings[0]);
    }
    const insulinLogs = getInsulinLogs();
    if (insulinLogs.length > 0) {
      setLastInsulin(insulinLogs[0]);
    }
  }, []);

  const quickAccessItems = [
    { href: '/log/glucose', label: 'Registrar Glicemia', icon: Droplet, color: 'bg-blue-500 hover:bg-blue-600' },
    { href: '/log/insulin', label: 'Registrar Insulina', icon: Pill, color: 'bg-green-500 hover:bg-green-600' },
    { href: '/meal-analysis', label: 'Analisar Refeição', icon: Camera, color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Bem-vindo(a) ao GlicemiaAI! Seu painel de controle para gerenciamento de diabetes." />

      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            <Link href={item.href} key={item.href} passHref>
              <Button
                variant="default"
                className={`w-full h-24 text-lg justify-start p-6 shadow-lg transition-transform hover:scale-105 ${item.color} text-primary-foreground`}
              >
                <item.icon className="h-8 w-8 mr-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplet className="mr-2 h-6 w-6 text-primary" />
              Última Glicemia Registrada
            </CardTitle>
            {lastGlucose && (
               <CardDescription>{formatDateTime(lastGlucose.timestamp)}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {lastGlucose ? (
              <div>
                <p className={`text-4xl font-bold ${getGlucoseLevelColor(classifyGlucoseLevel(lastGlucose.value))}`}>
                  {lastGlucose.value} <span className="text-xl text-muted-foreground">mg/dL</span>
                </p>
                {lastGlucose.mealContext && <p className="text-sm text-muted-foreground capitalize">Contexto: {lastGlucose.mealContext.replace('_', ' ')}</p>}
                {lastGlucose.notes && <p className="text-sm text-muted-foreground">Notas: {lastGlucose.notes}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum registro de glicemia encontrado.</p>
            )}
            <Link href="/log/glucose" passHref>
               <Button variant="outline" className="mt-4 w-full">
                 <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Registro
               </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="mr-2 h-6 w-6 text-accent" />
              Última Insulina Registrada
            </CardTitle>
            {lastInsulin && (
               <CardDescription>{formatDateTime(lastInsulin.timestamp)}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {lastInsulin ? (
              <div>
                <p className="text-3xl font-bold">
                  {lastInsulin.dose} <span className="text-xl text-muted-foreground">unidades</span>
                </p>
                <p className="text-sm text-muted-foreground">Tipo: {lastInsulin.type}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum registro de insulina encontrado.</p>
            )}
             <Link href="/log/insulin" passHref>
               <Button variant="outline" className="mt-4 w-full">
                 <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Registro
               </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
      
      {/* Placeholder for AI Insights summary */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-6 w-6 text-primary" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você verá aqui dicas e análises personalizadas da nossa IA para te ajudar a gerenciar melhor sua glicemia.
          </p>
          <Link href="/insights" passHref>
            <Button variant="link" className="mt-2 p-0">Ver mais insights</Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
