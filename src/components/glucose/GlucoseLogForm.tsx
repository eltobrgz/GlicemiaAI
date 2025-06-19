'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { GlucoseReading } from '@/types';
import { saveGlucoseReading } from '@/lib/storage';
import { generateId, classifyGlucoseLevel } from '@/lib/utils';
import { MEAL_CONTEXT_OPTIONS } from '@/config/constants';
import { useRouter } from 'next/navigation';

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
  initialData?: Partial<GlucoseReading>; // For editing, not implemented yet
}

export default function GlucoseLogForm({ onFormSubmit, initialData }: GlucoseLogFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<GlucoseFormData>({
    resolver: zodResolver(glucoseSchema),
    defaultValues: {
      value: initialData?.value || undefined,
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
      mealContext: initialData?.mealContext || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = (data: GlucoseFormData) => {
    const newReading: GlucoseReading = {
      id: initialData?.id || generateId(),
      value: data.value,
      timestamp: new Date(data.timestamp).toISOString(),
      mealContext: data.mealContext || undefined,
      notes: data.notes || undefined,
      level: classifyGlucoseLevel(data.value),
    };

    saveGlucoseReading(newReading);
    toast({
      title: 'Sucesso!',
      description: 'Registro de glicemia salvo.',
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
    router.push('/calendar'); // Navigate to calendar to see the new entry
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Registrar Glicemia</CardTitle>
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
