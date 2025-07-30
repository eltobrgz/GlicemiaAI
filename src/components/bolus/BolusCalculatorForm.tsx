
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';
import { Loader2, Calculator, Info, Utensils, Droplet, Plus, ChevronsRight, Equal, Syringe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useLogDialog } from '@/contexts/LogDialogsContext';

const calculatorSchema = z.object({
  carbs: z.coerce.number().min(0, 'Carboidratos não podem ser negativos.'),
  currentGlucose: z.coerce.number().min(1, 'Glicemia atual é obrigatória.'),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface CalculationResult {
  coverageDose: number;
  correctionDose: number;
  totalDose: number;
}

export default function BolusCalculatorForm() {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const { openDialog } = useLogDialog();

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      carbs: '' as any, // Initialize with empty string
      currentGlucose: '' as any, // Initialize with empty string
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error: any) {
        toast({ title: "Erro ao Carregar Perfil", description: error.message, variant: 'destructive' });
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const canCalculate = userProfile?.carb_ratio && userProfile?.correction_factor && userProfile?.target_glucose;

  const onSubmit = (data: CalculatorFormData) => {
    if (!canCalculate || !userProfile?.carb_ratio || !userProfile?.correction_factor || !userProfile?.target_glucose) {
      toast({ title: 'Configuração Incompleta', description: 'Por favor, configure seus fatores de cálculo no seu perfil.', variant: 'destructive' });
      return;
    }

    // Cobertura de carboidratos
    const coverageDose = data.carbs / userProfile.carb_ratio;

    // Correção de glicemia
    let correctionDose = 0;
    const glucoseDifference = data.currentGlucose - userProfile.target_glucose;
    if (glucoseDifference > 0) {
      correctionDose = glucoseDifference / userProfile.correction_factor;
    }
    // Nota: A lógica para hipoglicemia (correção negativa) pode ser adicionada aqui se necessário, mas geralmente não é subtraída da dose de cobertura.

    const totalDose = coverageDose + correctionDose;

    setCalculation({
      coverageDose: parseFloat(coverageDose.toFixed(2)),
      correctionDose: parseFloat(correctionDose.toFixed(2)),
      totalDose: parseFloat(totalDose.toFixed(1)), // Final dose often rounded to .5 or .0
    });
  };

  const handleRegisterDose = () => {
    if (calculation) {
      openDialog('insulin', { dose: calculation.totalDose });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3">Carregando configurações do perfil...</p>
      </div>
    );
  }

  if (!canCalculate) {
    return (
      <Alert variant="warning">
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração de Cálculo Necessária</AlertTitle>
        <AlertDescription>
          Para usar a calculadora de bolus, você precisa primeiro configurar seus fatores de tratamento (Ratio Carboidrato/Insulina, Fator de Correção e Glicemia Alvo) no seu perfil.
          <Link href="/profile">
            <Button className="mt-4">Ir para o Perfil</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <>
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Calculator className="mr-2 h-6 w-6" />
          Calcular Dose de Bolus
        </CardTitle>
        <CardDescription>
          Insira os dados da refeição e sua glicemia atual para estimar a dose de insulina.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="carbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="carbs">Total de Carboidratos (gramas)</FormLabel>
                  <FormControl>
                    <Input id="carbs" type="number" step="1" placeholder="Ex: 60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Calcular Dose
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>

    {calculation && (
        <Card className="w-full max-w-lg mx-auto shadow-xl mt-6 animate-fadeIn">
            <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Dose Recomendada</CardTitle>
                <CardDescription>Esta é uma estimativa baseada nos seus fatores. Sempre confirme com seu plano de tratamento.</CardDescription>
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
             <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={handleRegisterDose}>
                    Registrar Dose de Insulina <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )}
    </>
  );
}
