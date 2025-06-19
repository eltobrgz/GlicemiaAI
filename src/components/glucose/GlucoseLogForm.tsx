
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { GlucoseReading } from '@/types';
import { saveGlucoseReading } from '@/lib/storage'; // Now async
import { MEAL_CONTEXT_OPTIONS } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const glucoseSchema = z.object({
  value: z.coerce.number().min(1, 'Valor da glicemia é obrigatório e deve ser positivo.'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data e hora são obrigatórias.',
  }),
  mealContext: z.enum(['antes_refeicao', 'depois_refeicao', 'jejum', 'outro', '']).optional(),
  notes: z.string().max(500, 'Notas podem ter no máximo 500 caracteres.').optional(),
});

type GlucoseFormData = z.infer<typeof glucoseSchema>;

interface GlucoseLogFormProps {
  onFormSubmit?: () => void;
  initialData?: Partial<GlucoseReading>; 
}

export default function GlucoseLogForm({ onFormSubmit, initialData }: GlucoseLogFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<GlucoseFormData>({
    resolver: zodResolver(glucoseSchema),
    defaultValues: {
      value: initialData?.value || undefined,
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
      mealContext: initialData?.mealContext || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (data: GlucoseFormData) => {
    setIsSaving(true);
    try {
      const readingToSave: Omit<GlucoseReading, 'level' | 'id'> & {id?:string} = {
        id: initialData?.id, // Pass ID if editing
        value: data.value,
        timestamp: new Date(data.timestamp).toISOString(),
        mealContext: data.mealContext || undefined,
        notes: data.notes || undefined,
      };

      await saveGlucoseReading(readingToSave);
      toast({
        title: 'Sucesso!',
        description: `Registro de glicemia ${initialData?.id ? 'atualizado' : 'salvo'}.`,
        variant: 'default',
      });
      form.reset({ 
          timestamp: new Date().toISOString().substring(0, 16), 
          value: undefined, 
          mealContext: '', 
          notes: '' 
      });
      if (onFormSubmit) {
        onFormSubmit();
      }
      router.push('/calendar'); 
      router.refresh(); // Refresh to show updated data on calendar
    } catch (error: any) {
      toast({
        title: 'Erro ao Salvar',
        description: error.message || "Não foi possível salvar o registro.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">
          {initialData?.id ? 'Editar Registro de Glicemia' : 'Registrar Glicemia'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="value">Valor da Glicemia (mg/dL)</FormLabel>
                  <FormControl>
                    <Input id="value" type="number" placeholder="Ex: 98" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="timestamp">Data e Hora</FormLabel>
                  <FormControl>
                    <Input id="timestamp" type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mealContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="mealContext">Contexto da Refeição</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="mealContext">
                        <SelectValue placeholder="Selecionar contexto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_CONTEXT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="notes">Notas Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Senti-me cansado, após caminhada leve..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Eventos, sintomas, atividades físicas, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Salvando...' : (initialData?.id ? 'Atualizar Registro' : 'Salvar Registro')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
