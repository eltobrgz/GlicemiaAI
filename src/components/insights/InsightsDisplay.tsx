
'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserProfile, WeeklyInsightsOutput, WeeklyInsightsInput } from '@/types';
import { getGlucoseReadings, getInsulinLogs, getUserProfile, getActivityLogs, getMealAnalyses, getMedicationLogs } from '@/lib/storage';
import { generateWeeklyInsights } from '@/ai/flows/generate-weekly-insights';
import { Loader2, Lightbulb, Sparkles, TrendingUp, CheckCircle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type LoadingState = 'idle' | 'loading_data' | 'generating_insights' | 'success' | 'error';

export default function InsightsDisplay() {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [insights, setInsights] = useState<WeeklyInsightsOutput | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const fetchAndGenerateInsights = useCallback(async () => {
    setLoadingState('loading_data');
    setInsights(null);

    try {
      // 1. Fetch User Profile first
      const profile = await getUserProfile();
      setUserProfile(profile);

      if (!profile) {
          throw new Error("Perfil do usuário não encontrado.");
      }

      // 2. Fetch all data from the last 14 days
      const fourteenDaysAgo = subDays(new Date(), 14);
      const allGlucose = await getGlucoseReadings(profile);
      const allInsulin = await getInsulinLogs();
      const allActivity = await getActivityLogs();
      const allMeals = await getMealAnalyses();
      const allMedication = await getMedicationLogs();
      
      const filterByDate = (items: any[]) => items.filter(item => parseISO(item.timestamp) >= fourteenDaysAgo);

      const inputForAI: WeeklyInsightsInput = {
        userProfile: {
          name: profile.name,
          hypo_glucose_threshold: profile.hypo_glucose_threshold,
          target_glucose_low: profile.target_glucose_low,
          target_glucose_high: profile.target_glucose_high,
          hyper_glucose_threshold: profile.hyper_glucose_threshold,
        },
        glucoseReadings: filterByDate(allGlucose).map(r => ({ value: r.value, timestamp: r.timestamp, level: r.level || 'normal' })),
        insulinLogs: filterByDate(allInsulin).map(l => ({ dose: l.dose, timestamp: l.timestamp, type: l.type })),
        activityLogs: filterByDate(allActivity).map(a => ({ activity_type: a.activity_type, duration_minutes: a.duration_minutes, timestamp: a.timestamp })),
        mealAnalyses: filterByDate(allMeals).map(m => ({ foodIdentification: m.foodIdentification, macronutrientEstimates: m.macronutrientEstimates, timestamp: m.timestamp })),
        medicationLogs: filterByDate(allMedication).map(m => ({ medication_name: m.medication_name, dosage: m.dosage, timestamp: m.timestamp })),
        language: profile.languagePreference || 'pt-BR',
      };
      
      setLoadingState('generating_insights');
      const generatedInsights = await generateWeeklyInsights(inputForAI);
      
      setInsights(generatedInsights);
      setLoadingState('success');

    } catch (error: any) {
      console.error("Error generating insights:", error);
      toast({ title: "Erro ao gerar insights", description: error.message, variant: "destructive" });
      setLoadingState('error');
    }
  }, [toast]);

  // Automatically fetch insights on component mount
  useEffect(() => {
    fetchAndGenerateInsights();
  }, [fetchAndGenerateInsights]);

  const renderLoadingState = () => (
    <div className="flex flex-col justify-center items-center h-64 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary">
        {loadingState === 'loading_data' ? 'Coletando seus dados...' : 'Nossa IA está analisando sua semana...'}
      </p>
      <p className="text-muted-foreground">Isso pode levar um momento. Obrigado pela sua paciência!</p>
    </div>
  );

  const renderErrorState = () => (
    <Card className="shadow-md border-destructive">
        <CardHeader>
            <CardTitle>Erro ao Gerar Análise</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                Não foi possível gerar seus insights no momento. Por favor, tente novamente.
            </p>
            <button onClick={fetchAndGenerateInsights} className="text-primary hover:underline">
                Tentar Novamente
            </button>
        </CardContent>
    </Card>
  );

  const renderSuccessState = () => (
    !insights ? <p>Nenhum insight disponível.</p> :
    <div className="space-y-6">
        <Alert variant="info">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Análise Semanal da IA</AlertTitle>
            <AlertDescription>
                Este é um resumo gerado por IA dos seus dados da última semana ({format(subDays(new Date(), 7), 'dd/MM')} a {format(new Date(), 'dd/MM')}). Use-o como um ponto de partida para conversas com sua equipe de saúde.
            </AlertDescription>
        </Alert>

        <Card className="shadow-lg bg-card">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-primary">Resumo da Semana</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-base whitespace-pre-wrap">{insights.weeklySummary}</p>
            </CardContent>
        </Card>

        {insights.positiveObservations && insights.positiveObservations.length > 0 && (
             <Card className="shadow-md border-green-500/50 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-green-700 dark:text-green-400"><TrendingUp className="mr-2 h-5 w-5"/>Pontos Positivos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                        {insights.positiveObservations.map((obs, index) => <li key={index}>{obs}</li>)}
                    </ul>
                </CardContent>
            </Card>
        )}

        {insights.improvementPoints && insights.improvementPoints.length > 0 && (
             <Card className="shadow-md border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400"><Target className="mr-2 h-5 w-5"/>Pontos de Atenção</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                        {insights.improvementPoints.map((point, index) => <li key={index}>{point}</li>)}
                    </ul>
                </CardContent>
            </Card>
        )}
       
        <Card className="shadow-lg bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="flex items-center text-primary"><Sparkles className="mr-2 h-5 w-5"/>Dica da Semana</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="font-medium text-lg">{insights.actionableTip}</p>
            </CardContent>
        </Card>

    </div>
  );

  return (
    <Fragment>
      {loadingState === 'loading_data' || loadingState === 'generating_insights' 
        ? renderLoadingState()
        : loadingState === 'error'
        ? renderErrorState()
        : renderSuccessState()
      }
    </Fragment>
  );
}
