
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { UploadCloud, Loader2, Camera } from 'lucide-react';
import type { MealAnalysis, AnalyzeMealImageOutput, UserProfile, AnalyzeMealImageInput } from '@/types';
import { analyzeMealImage as analyzeMealImageFlow } from '@/ai/flows/analyze-meal-image';
import { fileToDataUri } from '@/lib/utils';
import { saveMealAnalysis, getUserProfile } from '@/lib/storage';

const mealAnalysisSchema = z.object({
  mealPhoto: z.instanceof(File, { message: 'Por favor, selecione uma imagem da refeição.' })
    .refine(file => file.size <= 5 * 1024 * 1024, `O arquivo deve ter no máximo 5MB.`)
    .refine(file => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
     ".jpg, .jpeg, .png, .webp, .gif são os formatos suportados."),
  userContext: z.string().max(1000, 'Contexto do usuário pode ter no máximo 1000 caracteres.').optional(),
});

type MealAnalysisFormData = z.infer<typeof mealAnalysisSchema>;

interface MealImageFormProps {
  onAnalysisComplete: (analysisResult: MealAnalysis) => void;
}

export default function MealImageForm({ onAnalysisComplete }: MealImageFormProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch user profile for meal analysis:", error);
        // User can still proceed, AI will default to pt-BR
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const form = useForm<MealAnalysisFormData>({
    resolver: zodResolver(mealAnalysisSchema),
    defaultValues: {
      userContext: '',
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('mealPhoto', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
      form.resetField('mealPhoto');
    }
  };
  
  const onSubmit = async (data: MealAnalysisFormData) => {
    setIsAnalyzing(true);
    try {
      const mealPhotoDataUri = await fileToDataUri(data.mealPhoto);
      
      const aiInput: AnalyzeMealImageInput = {
        mealPhotoDataUri,
        userContext: data.userContext,
        language: userProfile?.languagePreference || 'pt-BR',
      };

      const aiResult: AnalyzeMealImageOutput = await analyzeMealImageFlow(aiInput);
      
      const analysisDataForStorage: Omit<MealAnalysis, 'id' | 'imageUrl' | 'user_id' | 'created_at'> & { mealPhotoFile: File } = {
        timestamp: new Date().toISOString(), 
        originalImageFileName: data.mealPhoto.name,
        foodIdentification: aiResult.foodIdentification,
        macronutrientEstimates: aiResult.macronutrientEstimates,
        estimatedGlucoseImpact: aiResult.estimatedGlucoseImpact,
        suggestedInsulinDose: aiResult.suggestedInsulinDose,
        improvementTips: aiResult.improvementTips,
        mealPhotoFile: data.mealPhoto, 
      };
      
      const savedAnalysis = await saveMealAnalysis(analysisDataForStorage); 
      
      onAnalysisComplete(savedAnalysis); 

      toast({
        title: 'Análise Concluída!',
        description: 'Sua refeição foi analisada e salva com sucesso.',
      });
      form.reset();
      setPreviewImage(null); 

    } catch (error: any) {
      console.error('Meal analysis error:', error);
      toast({
        title: 'Erro na Análise',
        description: error.message || 'Não foi possível analisar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <Camera className="mr-2 h-7 w-7" /> Analisar Refeição com IA
            </CardTitle>
            <CardDescription>
              Tire uma foto da sua refeição e nossa IA fornecerá uma estimativa de macronutrientes, impacto glicêmico e mais. A foto será salva no seu histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="mealPhoto"
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel htmlFor="mealPhoto" className="text-base">Foto da Refeição</FormLabel>
                  <FormControl>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                      <div className="text-center">
                        {previewImage ? (
                          <Image src={previewImage} alt="Preview da refeição" width={200} height={200} className="mx-auto mb-4 rounded-md object-contain max-h-48" />
                        ) : (
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        )}
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                          <label
                            htmlFor="mealPhoto"
                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                          >
                            <span>Carregar um arquivo</span>
                            <input id="mealPhoto" name="mealPhoto" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, image/gif" onChange={handleFileChange} disabled={isAnalyzing} />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF, WEBP até 5MB</p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="userContext">Contexto Adicional (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="userContext"
                      placeholder="Ex: Minha glicemia atual é 120mg/dL, sou sensível à insulina X, prefiro refeições low-carb..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isAnalyzing}
                    />
                  </FormControl>
                  <FormDescription>
                    Informações como glicemia atual, sensibilidade à insulina, preferências alimentares podem ajudar a IA.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6" disabled={isAnalyzing || isLoadingProfile || !form.formState.isValid || !previewImage}>
              {isAnalyzing || isLoadingProfile ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLoadingProfile ? 'Carregando pref...' : 'Analisando...'}
                </>
              ) : (
                'Analisar Refeição e Salvar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
