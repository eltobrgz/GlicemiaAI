
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
import type { ActivityLog } from '@/types';
import { saveActivityLog } from '@/lib/storage';
import { ACTIVITY_TYPES_OPTIONS, ACTIVITY_INTENSITY_OPTIONS } from '@/config/constants'; // Usar de types
import { useRouter } from 'next/navigation';
import { Loader2, Bike } from 'lucide-react';
import { useState } from 'react';

const activitySchema = z.object({
  activity_type: z.string().min(1, 'Tipo de atividade é obrigatório.'),
  duration_minutes: z.coerce.number().min(1, 'Duração deve ser de pelo menos 1 minuto.'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data e hora são obrigatórias.',
  }),
  intensity: z.enum(['leve', 'moderada', 'intensa', '']).optional(),
  notes: z.string().max(500, 'Notas podem ter no máximo 500 caracteres.').optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityLogFormProps {
  onFormSubmit?: () => void;
  initialData?: Partial<ActivityLog>;
}

export default function ActivityLogForm({ onFormSubmit, initialData }: ActivityLogFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity_type: initialData?.activity_type || '',
      duration_minutes: initialData?.duration_minutes ?? ('' as any),
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
      intensity: initialData?.intensity || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    setIsSaving(true);
    try {
      const logToSave: Omit<ActivityLog, 'user_id' | 'created_at'> & {id?:string} = {
        id: initialData?.id,
        activity_type: data.activity_type,
        duration_minutes: data.duration_minutes,
        timestamp: new Date(data.timestamp).toISOString(),
        intensity: data.intensity as ActivityLog['intensity'] || undefined,
        notes: data.notes || undefined,
      };

      await saveActivityLog(logToSave);
      toast({
        title: 'Sucesso!',
        description: `Registro de atividade ${initialData?.id ? 'atualizado' : 'salvo'}.`,
      });
      form.reset({
          activity_type: '',
          duration_minutes: '' as any,
          timestamp: new Date().toISOString().substring(0, 16),
          intensity: '',
          notes: ''
      });
      if (onFormSubmit) {
        onFormSubmit();
      }
      router.push('/calendar?tab=activity'); 
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Erro ao Salvar',
        description: error.message || "Não foi possível salvar o registro de atividade.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Bike className="mr-2 h-6 w-6" />
          {initialData?.id ? 'Editar Registro de Atividade' : 'Registrar Atividade Física'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="activity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="activity_type">Tipo de Atividade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger id="activity_type">
                        <SelectValue placeholder="Selecionar tipo de atividade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_TYPES_OPTIONS.map(option => (
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
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="duration_minutes">Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input id="duration_minutes" type="number" placeholder="Ex: 30" {...field} />
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
                  <FormLabel htmlFor="timestamp">Data e Hora de Início</FormLabel>
                  <FormControl>
                    <Input id="timestamp" type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="intensity">Intensidade (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger id="intensity">
                        <SelectValue placeholder="Selecionar intensidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_INTENSITY_OPTIONS.map(option => (
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
                  <FormLabel htmlFor="notes">Notas Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Ritmo leve, senti um pouco de cansaço no final..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Salvando...' : (initialData?.id ? 'Atualizar Atividade' : 'Salvar Atividade')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
