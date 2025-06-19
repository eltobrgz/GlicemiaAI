'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import MealImageForm from '@/components/meal/MealImageForm';
import MealAnalysisDisplay from '@/components/meal/MealAnalysisDisplay';
import type { MealAnalysis } from '@/types';
import { getMealAnalyses, deleteMealAnalysis } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';

export default function MealAnalysisPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<MealAnalysis[]>([]);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    setPastAnalyses(getMealAnalyses());
  }, []);

  const handleAnalysisComplete = (analysisResult: MealAnalysis) => {
    setCurrentAnalysis(analysisResult);
    setPastAnalyses(prev => [analysisResult, ...prev]); // Add to top of the list
    setShowForm(false);
  };

  const handleShowNewAnalysisForm = () => {
    setCurrentAnalysis(null);
    setShowForm(true);
  };

  const handleDeleteAnalysis = (id: string) => {
    deleteMealAnalysis(id);
    setPastAnalyses(prev => prev.filter(a => a.id !== id));
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(null);
      setShowForm(true);
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
        description="Use a inteligência artificial para entender melhor suas refeições e seu impacto glicêmico."
      >
        {!showForm && (
          <Button onClick={handleShowNewAnalysisForm} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" /> Nova Análise
          </Button>
        )}
      </PageHeader>

      {showForm && <MealImageForm onAnalysisComplete={handleAnalysisComplete} />}
      
      {currentAnalysis && (
        <>
          <MealAnalysisDisplay analysis={currentAnalysis} />
          <div className="text-center mt-4">
            <Button onClick={() => handleDeleteAnalysis(currentAnalysis.id)} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Apagar esta Análise
            </Button>
          </div>
        </>
      )}

      {pastAnalyses.length > 0 && (
        <Card className="mt-12 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Histórico de Análises</CardTitle>
            <CardDescription>Veja suas análises de refeições anteriores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastAnalyses.map((analysis) => (
              <div key={analysis.id} className="p-4 border rounded-lg flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  {analysis.imageUrl && (
                     <Image 
                        src={analysis.imageUrl} 
                        alt={analysis.foodIdentification.substring(0,30)} 
                        width={80} 
                        height={80} 
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="food plate"
                      />
                  )}
                  <div>
                    <h3 className="font-semibold text-primary">{analysis.foodIdentification.substring(0, 50)}{analysis.foodIdentification.length > 50 ? '...' : ''}</h3>
                    <p className="text-xs text-muted-foreground">Analisado em: {formatDateTime(analysis.timestamp)}</p>
                    <p className="text-sm mt-1">Carbs: {analysis.macronutrientEstimates.carbohydrates.toFixed(0)}g, Prot: {analysis.macronutrientEstimates.protein.toFixed(0)}g, Fat: {analysis.macronutrientEstimates.fat.toFixed(0)}g</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                   <Button onClick={() => handleViewPastAnalysis(analysis)} variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                  <Button onClick={() => handleDeleteAnalysis(analysis.id)} variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Apagar</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
