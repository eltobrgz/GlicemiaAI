
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { MedicationLog } from '@/types';
import { saveMedicationLog } from '@/lib/storage';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const medicationSchema = z.object({
  medication_name: z.string().min(1, 'O nome do medicamento é obrigatório.'),
  dosage: z.string().min(1, 'A dosagem é obrigatória.'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data e hora são obrigatórias.',
  }),
  notes: z.string().max(500, 'Notas podem ter no máximo 500 caracteres.').optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface MedicationLogFormProps {
  onFormSubmit: () => void;
  initialData?: Partial<MedicationLog>;
}

export default function MedicationLogForm({ onFormSubmit, initialData }: MedicationLogFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medication_name: '',
      dosage: '',
      timestamp: new Date().toISOString().substring(0, 16),
      notes: '',
    },
  });

  useEffect(() => {
    form.reset({
      medication_name: initialData?.medication_name || '',
      dosage: initialData?.dosage || '',
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
      notes: initialData?.notes || '',
    });
  }, [initialData, form]);

  const onSubmit = async (data: MedicationFormData) => {
    setIsSaving(true);
    try {
      const logToSave: Omit<MedicationLog, 'user_id' | 'created_at'> & {id?:string} = {
        id: initialData?.id,
        medication_name: data.medication_name,
        dosage: data.dosage,
        timestamp: new Date(data.timestamp).toISOString(),
        notes: data.notes || undefined,
      };

      await saveMedicationLog(logToSave);
      toast({
        title: 'Sucesso!',
        description: `Registro de medicamento ${initialData?.id ? 'atualizado' : 'salvo'}.`,
      });
      onFormSubmit();
    } catch (error: any) {
      toast({
        title: 'Erro ao Salvar',
        description: error.message || "Não foi possível salvar o registro do medicamento.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="medication_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="medication_name">Nome do Medicamento</FormLabel>
                <FormControl>
                  <Input id="medication_name" placeholder="Ex: Metformina, Jardiance..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="dosage">Dosagem</FormLabel>
                <FormControl>
                  <Input id="dosage" type="text" placeholder="Ex: 500mg, 1 comprimido" {...field} />
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="notes">Notas Adicionais (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    id="notes"
                    placeholder="Ex: Tomado junto com o café da manhã."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Salvando...' : (initialData?.id ? 'Atualizar Medicamento' : 'Salvar Medicamento')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
