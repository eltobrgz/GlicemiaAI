'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { InsulinLog } from '@/types';
import { saveInsulinLog } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { INSULIN_TYPES } from '@/config/constants';
import { useRouter } from 'next/navigation';

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
  initialData?: Partial<InsulinLog>; // For editing
}

export default function InsulinLogForm({ onFormSubmit, initialData }: InsulinLogFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<InsulinFormData>({
    resolver: zodResolver(insulinSchema),
    defaultValues: {
      type: initialData?.type || '',
      dose: initialData?.dose || undefined,
      timestamp: initialData?.timestamp ? new Date(initialData.timestamp).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
    },
  });

  const onSubmit = (data: InsulinFormData) => {
    const newLog: InsulinLog = {
      id: initialData?.id || generateId(),
      type: data.type,
      dose: data.dose,
      timestamp: new Date(data.timestamp).toISOString(),
    };

    saveInsulinLog(newLog);
    toast({
      title: 'Sucesso!',
      description: 'Registro de insulina salvo.',
    });
    form.reset({ 
        timestamp: new Date().toISOString().substring(0, 16), 
        type: '', 
        dose: undefined 
    });
    if (onFormSubmit) {
      onFormSubmit();
    }
    // Potentially navigate to a list of insulin logs or back to dashboard
    router.push('/dashboard'); 
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Registrar Insulina</CardTitle>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Registro de Insulina'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
