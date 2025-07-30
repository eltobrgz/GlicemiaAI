
'use client';
import { useState, useEffect } from 'react';
import type { MealAnalysis, UserProfile, BolusCalculationResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Utensils, Info, Lightbulb, Camera, Calculator, Droplet, Plus, Equal, Syringe, ChevronsRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useLogDialog } from '@/contexts/LogDialogsContext';

interface MealAnalysisDisplayProps {
  analysis: MealAnalysis;
  userProfile: UserProfile | null;
}

const bolusSchema = z.object({
  currentGlucose: z.coerce.number().min(1, 'Glicemia atual é obrigatória.'),
});
type BolusFormData = z.infer<typeof bolusSchema>;

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center text-lg text-primary">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm">
      {children}
    </CardContent>
  </Card>
);

export default function MealAnalysisDisplay({ analysis, userProfile }: MealAnalysisDisplayProps) {
  const { toast } = useToast();
  const [calculation, setCalculation] = useState<BolusCalculationResult | null>(null);
  const { openDialog } = useLogDialog();
  
  const canCalculate = userProfile?.carb_ratio && userProfile?.correction_factor && userProfile?.target_glucose;

  const form = useForm<BolusFormData>({
    resolver: zodResolver(bolusSchema),
    defaultValues: { currentGlucose: '' as any },
  });
  
  const onSubmit = (data: BolusFormData) => {
    if (!canCalculate || !userProfile?.carb_ratio || !userProfile?.correction_factor || !userProfile?.target_glucose) {
      toast({ title: 'Configuração Incompleta', description: 'Por favor, configure seus fatores de cálculo no seu perfil.', variant: 'destructive' });
      return;
    }

    const coverageDose = analysis.macronutrientEstimates.carbohydrates / userProfile.carb_ratio;
    let correctionDose = 0;
    const glucoseDifference = data.currentGlucose - userProfile.target_glucose;
    if (glucoseDifference > 0) {
      correctionDose = glucoseDifference / userProfile.correction_factor;
    }
    const totalDose = coverageDose + correctionDose;

    setCalculation({
      coverageDose: parseFloat(coverageDose.toFixed(2)),
      correctionDose: parseFloat(correctionDose.toFixed(2)),
      totalDose: parseFloat(totalDose.toFixed(1)),
    });
  };

  const handleRegisterDose = () => {
    if (calculation) {
      openDialog('insulin', { dose: calculation.totalDose });
    }
  };

  return (
    <div className="space-y-6 mt-6 animate-fadeIn">
      <Card className="overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Imagem da Refeição Analisada</CardTitle>
            {analysis.originalImageFileName && <CardDescription>Arquivo: {analysis.originalImageFileName}</CardDescription>}
          </CardHeader>
          <CardContent className="flex justify-center">
            {analysis.imageUrl ? (
                <Image
                  src={analysis.imageUrl}
                  alt={analysis.foodIdentification || "Refeição analisada"}
                  width={400}
                  height={300}
                  className="rounded-md object-cover max-h-[400px]"
                  data-ai-hint="food meal delicious"
                />
            ) : (
              <div className="w-full h-[300px] bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground" data-ai-hint="placeholder cooking kitchen">
                <Camera className="h-16 w-16 mb-2" />
                <span>Imagem não disponível</span>
              </div>
            )}
          </CardContent>
        </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Identificação dos Alimentos" icon={Utensils} className="shadow-md">
          <p>{analysis.foodIdentification}</p>
        </SectionCard>

        <SectionCard title="Estimativa de Macronutrientes" icon={Info} className="shadow-md">
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Carboidratos:</strong> {analysis.macronutrientEstimates.carbohydrates.toFixed(1)}g</li>
            <li><strong>Proteínas:</strong> {analysis.macronutrientEstimates.protein.toFixed(1)}g</li>
            <li><strong>Gorduras:</strong> {analysis.macronutrientEstimates.fat.toFixed(1)}g</li>
          </ul>
        </SectionCard>
      </div>
      
      <SectionCard title="Impacto Glicêmico Estimado" icon={Lightbulb} className="shadow-md bg-accent/10">
         <p className="font-medium">{analysis.estimatedGlucoseImpact}</p>
      </SectionCard>
      
      <SectionCard title="Dicas de Melhoria para a Refeição" icon={Utensils} className="shadow-md">
        <p>{analysis.improvementTips}</p>
      </SectionCard>

      {/* Bolus Calculator Section */}
      {canCalculate ? (
         <Card className="shadow-lg bg-primary/10 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center text-primary"><Calculator className="mr-2 h-5 w-5"/>Calcular Dose de Bolus</CardTitle>
              <CardDescription>Insira sua glicemia atual para calcular a dose de insulina para esta refeição.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentGlucose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="currentGlucose">Sua Glicemia Atual (mg/dL)</FormLabel>
                        <FormControl>
                          <Input id="currentGlucose" type="number" placeholder="Ex: 150" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto">Calcular Dose</Button>
                </form>
              </Form>
            </CardContent>
        </Card>
      ) : (
         <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Calculadora de Bolus Indisponível</AlertTitle>
          <AlertDescription>
            Para calcular a dose de insulina automaticamente, por favor, configure seus fatores de tratamento (Ratio Carboidrato/Insulina, Fator de Correção e Glicemia Alvo) no seu perfil.
            <Link href="/profile">
              <Button className="mt-4" size="sm">Ir para o Perfil</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {calculation && (
         <Card className="w-full mx-auto shadow-xl mt-6 animate-fadeIn">
            <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Dose Recomendada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <p className="text-muted-foreground text-sm">Dose Total Estimada</p>
                    <p className="text-5xl font-bold text-primary">{calculation.totalDose.toFixed(1)}</p>
                    <p className="text-muted-foreground">unidades de insulina rápida</p>
                </div>
                
                <div>
                    <h4 className="font-semibold mb-2">Detalhes do Cálculo:</h4>
                    <div className="space-y-2 text-sm p-4 border rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center"><Utensils className="mr-2 h-4 w-4 text-muted-foreground" />Dose de Cobertura (Carbs)</span>
                            <span className="font-mono">{calculation.coverageDose.toFixed(2)} U</span>
                        </div>
                        <div className="flex justify-center"><Plus size={16} className="text-muted-foreground"/></div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center"><Droplet className="mr-2 h-4 w-4 text-muted-foreground" />Dose de Correção (Glicemia)</span>
                            <span className="font-mono">{calculation.correctionDose.toFixed(2)} U</span>
                        </div>
                        <div className="flex justify-center pt-2"><Equal size={16} className="text-primary font-bold"/></div>
                         <div className="flex justify-between items-center pt-2 border-t font-bold text-base text-primary">
                            <span className="flex items-center"><Syringe className="mr-2 h-4 w-4" />Dose Total</span>
                            <span className="font-mono">{calculation.totalDose.toFixed(1)} U</span>
                        </div>
                    </div>
                </div>

                <Alert variant="destructive">
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Aviso Importante</AlertTitle>
                    <AlertDescription>
                        Esta calculadora é uma ferramenta de auxílio e não substitui o julgamento clínico profissional. As doses devem ser ajustadas para fatores como atividade física, estresse ou doenças. Sempre siga as orientações da sua equipe de saúde.
                    </AlertDescription>
                </Alert>
            </CardContent>
             <CardContent className="flex justify-end">
                <Button variant="outline" onClick={handleRegisterDose}>
                    Registrar Dose de Insulina <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
