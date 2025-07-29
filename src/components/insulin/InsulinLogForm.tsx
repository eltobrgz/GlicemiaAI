
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { InsulinLog } from '@/types';
import { saveInsulinLog } from '@/lib/storage';
import { INSULIN_TYPES } from '@/config/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const insulinSchema = z.object({
  type: z.string().min(1, 'Tipo de insulina é obrigatório.'),
  dose: z.coerce.number().min(0.1, 'Dose é obrigatória e deve ser positiva.'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data e hora são obrigatórias.',
  }),
});

type InsulinFormData = z.infer<typeof insulinSchema>;

interface InsulinLogFormProps {
  onFormSubmit?: () => void;
  initialData?: Partial<InsulinLog>;
}

export default function InsulinLogForm({ onFormSubmit, initialData }: InsulinLogFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const defaultTimestamp = new Date().toISOString().substring(0, 16);

  const form = useForm<InsulinFormData>({
    resolver: zodResolver(insulinSchema),
    defaultValues: {
      type: initialData?.type || searchParams.get('type') || '',
      dose: initialData?.dose ?? (searchParams.get('dose') ? parseFloat(searchParams.get('dose')!) : ('' as any)),
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : defaultTimestamp,
    },
  });

  useEffect(() => {
    const prefillType = searchParams.get('type');
    const prefillDose = searchParams.get('dose');

    if (prefillType) {
      form.setValue('type', prefillType);
    }
    if (prefillDose) {
      form.setValue('dose', parseFloat(prefillDose));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, form.setValue]);


  const onSubmit = async (data: InsulinFormData) => {
    setIsSaving(true);
    try {
      const logToSave: Omit<InsulinLog, 'user_id' | 'created_at'> & { id?: string } = {
        id: initialData?.id,
        type: data.type,
        dose: data.dose,
        timestamp: new Date(data.timestamp).toISOString(),
      };

      await saveInsulinLog(logToSave);
      toast({
        title: 'Sucesso!',
        description: `Registro de insulina ${initialData?.id ? 'atualizado' : 'salvo'}.`,
      });
      form.reset({
          timestamp: defaultTimestamp,
          type: '',
          dose: '' as any
      });
      if (onFormSubmit) {
        onFormSubmit();
      }
      // Redirect to calendar page, insulin tab after saving
      router.push('/calendar?tab=insulin'); 
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Erro ao Salvar',
        description: error.message || "Não foi possível salvar o registro de insulina.",
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
          {initialData?.id ? 'Editar Registro de Insulina' : 'Registrar Insulina'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="type">Tipo de Insulina</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecionar tipo de insulina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INSULIN_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="dose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="dose">Dose (unidades)</FormLabel>
                  <FormControl>
                    <Input id="dose" type="number" step="0.1" placeholder="Ex: 10.5" {...field} />
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
                  <FormLabel htmlFor="timestamp">Data e Hora da Administração</FormLabel>
                  <FormControl>
                    <Input id="timestamp" type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Salvando...' : (initialData?.id ? 'Atualizar Registro' : 'Salvar Registro de Insulina')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
