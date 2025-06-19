
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import MealImageForm from '@/components/meal/MealImageForm';
import MealAnalysisDisplay from '@/components/meal/MealAnalysisDisplay';
import type { MealAnalysis } from '@/types';
import { getMealAnalyses, deleteMealAnalysis } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Loader2, Album } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function MealAnalysisPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<MealAnalysis[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      const analyses = await getMealAnalyses();
      setPastAnalyses(analyses);
    } catch (error: any) {
      toast({ title: "Erro ao buscar histórico de análises", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleAnalysisComplete = useCallback(async (analysisResult: MealAnalysis) => {
    // MealImageForm now handles saving to Supabase (including image upload) via saveMealAnalysis from storage.ts
    // and returns the complete MealAnalysis object with the Supabase Storage URL.
    setCurrentAnalysis(analysisResult);
    // Prepend to local state for immediate UI update.
    // fetchAnalyses will be called again if needed or to ensure consistency.
    setPastAnalyses(prev => [analysisResult, ...prev.filter(p => p.id !== analysisResult.id)]);
    setShowForm(false);
    // Optionally, call fetchAnalyses() again if you want to ensure the list is exactly from DB
    // but for UX, prepend and then rely on next full fetch is often good.
    // await fetchAnalyses(); // This would re-fetch everything
  }, []);

  const handleShowNewAnalysisForm = () => {
    setCurrentAnalysis(null);
    setShowForm(true);
  };

  const handleDeleteAnalysis = async (id: string) => {
    // Consider also deleting the image from Supabase Storage if needed
    // This logic would be in deleteMealAnalysis in storage.ts or here.
    try {
      await deleteMealAnalysis(id);
      toast({ title: "Análise apagada" });
      setPastAnalyses(prev => prev.filter(a => a.id !== id));
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
        setShowForm(true);
      }
    } catch (error: any) {
      toast({ title: "Erro ao apagar análise", description: error.message, variant: "destructive" });
    }
  };
  
  const handleViewPastAnalysis = (analysis: MealAnalysis) => {
    setCurrentAnalysis(analysis);
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise de Refeições com IA"
        description="Use a inteligência artificial para entender melhor suas refeições e seu impacto glicêmico. As fotos são salvas no seu histórico."
      >
        {!showForm && (
          <Button onClick={handleShowNewAnalysisForm} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" /> Nova Análise
          </Button>
        )}
      </PageHeader>

      {showForm && <MealImageForm onAnalysisComplete={handleAnalysisComplete} />}
      
      {currentAnalysis && !showForm && (
        <>
          <MealAnalysisDisplay analysis={currentAnalysis} />
          <div className="text-center mt-4">
            <Button onClick={() => handleDeleteAnalysis(currentAnalysis.id)} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Apagar esta Análise
            </Button>
          </div>
        </>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3">Carregando histórico de análises...</p>
        </div>
      )}

      {!isLoading && pastAnalyses.length > 0 && (
        <Card className="mt-12 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Album className="mr-2 h-6 w-6 text-primary" />Histórico de Análises</CardTitle>
            <CardDescription>Veja suas análises de refeições anteriores. As imagens são carregadas do seu armazenamento seguro.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastAnalyses.map((analysis) => (
              <Card key={analysis.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200 ease-in-out flex flex-col">
                <CardHeader className="p-4">
                   {analysis.imageUrl ? (
                     <Image 
                        src={analysis.imageUrl} 
                        alt={analysis.foodIdentification.substring(0,50) || 'Imagem da refeição'} 
                        width={300} 
                        height={200} 
                        className="rounded-md object-cover aspect-video w-full"
                        data-ai-hint="food plate"
                      />
                  ) : (
                    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center" data-ai-hint="placeholder food">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-semibold text-primary truncate" title={analysis.foodIdentification}>{analysis.foodIdentification.substring(0, 40)}{analysis.foodIdentification.length > 40 ? '...' : ''}</h3>
                  <p className="text-xs text-muted-foreground">Analisado em: {formatDateTime(analysis.timestamp)}</p>
                  <p className="text-sm mt-1">Carbs: {analysis.macronutrientEstimates.carbohydrates.toFixed(0)}g, Prot: {analysis.macronutrientEstimates.protein.toFixed(0)}g, Fat: {analysis.macronutrientEstimates.fat.toFixed(0)}g</p>
                </CardContent>
                <CardFooter className="p-4 border-t flex items-center justify-between gap-2">
                   <Button onClick={() => handleViewPastAnalysis(analysis)} variant="outline" size="sm" className="flex-1">
                    Ver Detalhes
                  </Button>
                  <Button onClick={() => handleDeleteAnalysis(analysis.id)} variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 shrink-0">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Apagar</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
       {!isLoading && pastAnalyses.length === 0 && !showForm && !currentAnalysis &&(
         <p className="text-center text-muted-foreground py-10">Nenhuma análise de refeição encontrada no histórico.</p>
       )}
    </div>
  );
}

