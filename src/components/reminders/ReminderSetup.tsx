'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { ReminderConfig, DayOfWeek } from '@/types';
import { getReminders, saveReminder, deleteReminder } from '@/lib/storage';
import { generateId, formatTime } from '@/lib/utils';
import { DAYS_OF_WEEK, INSULIN_TYPES } from '@/config/constants';
import { PlusCircle, Trash2, Bell, Phone } from 'lucide-react';

const reminderSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['glicemia', 'insulina']),
  name: z.string().min(1, 'Nome do lembrete é obrigatório.'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:MM).'),
  days: z.union([z.array(z.enum(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'])).min(1, "Selecione pelo menos um dia."), z.literal('todos_os_dias')]),
  enabled: z.boolean().default(true),
  insulinType: z.string().optional(),
  insulinDose: z.coerce.number().optional(),
  isSimulatedCall: z.boolean().optional(),
  simulatedCallContact: z.string().optional(),
  customSound: z.string().optional(), // Placeholder for custom sound selection
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export default function ReminderSetup() {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setReminders(getReminders());
  }, []);

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: 'glicemia',
      name: '',
      time: '08:00',
      days: 'todos_os_dias',
      enabled: true,
    },
  });
  
  const reminderType = form.watch('type');
  const isSimulatedCallEnabled = form.watch('isSimulatedCall');

  useEffect(() => {
    if (editingReminder) {
      form.reset({
        id: editingReminder.id,
        type: editingReminder.type,
        name: editingReminder.name,
        time: editingReminder.time,
        days: editingReminder.days,
        enabled: editingReminder.enabled,
        insulinType: editingReminder.insulinType,
        insulinDose: editingReminder.insulinDose,
        isSimulatedCall: editingReminder.isSimulatedCall,
        simulatedCallContact: editingReminder.simulatedCallContact,
        customSound: editingReminder.customSound,
      });
    } else {
      form.reset({
        type: 'glicemia', name: '', time: '08:00', days: 'todos_os_dias', enabled: true,
        insulinType: '', insulinDose: undefined, isSimulatedCall: false, simulatedCallContact: '', customSound: ''
      });
    }
  }, [editingReminder, form]);

  const onSubmit = (data: ReminderFormData) => {
    const reminderToSave: ReminderConfig = {
      id: data.id || generateId(),
      ...data,
      // Ensure optional fields are undefined if empty, based on type
      insulinType: data.type === 'insulina' ? data.insulinType : undefined,
      insulinDose: data.type === 'insulina' ? data.insulinDose : undefined,
      isSimulatedCall: data.type === 'insulina' ? data.isSimulatedCall : undefined,
      simulatedCallContact: data.type === 'insulina' && data.isSimulatedCall ? data.simulatedCallContact : undefined,
    };

    saveReminder(reminderToSave);
    setReminders(getReminders());
    toast({
      title: editingReminder ? 'Lembrete Atualizado!' : 'Lembrete Salvo!',
      description: `Lembrete "${data.name}" foi ${editingReminder ? 'atualizado' : 'salvo'} com sucesso.`,
    });
    setEditingReminder(null);
  };

  const handleEdit = (reminder: ReminderConfig) => {
    setEditingReminder(reminder);
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
    setReminders(getReminders());
    toast({
      title: 'Lembrete Apagado!',
      variant: 'destructive',
    });
    if (editingReminder?.id === id) {
      setEditingReminder(null);
    }
  };

  const handleAddNew = () => {
    setEditingReminder(null); // This will trigger useEffect to reset the form
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">
            {editingReminder ? 'Editar Lembrete' : 'Configurar Novo Lembrete'}
          </CardTitle>
          <CardDescription>
            {editingReminder ? 'Modifique os detalhes do seu lembrete.' : 'Crie lembretes para medições de glicemia ou doses de insulina.'}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Lembrete</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="glicemia">Medição de Glicemia</SelectItem>
                      <SelectItem value="insulina">Dose de Insulina</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do Lembrete</FormLabel><FormControl><Input placeholder="Ex: Glicemia pós-almoço" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias da Semana</FormLabel>
                    <Controller
                      control={form.control}
                      name="days"
                      render={({ field: daysField }) => (
                        <>
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id="todos_os_dias"
                              checked={daysField.value === 'todos_os_dias'}
                              onCheckedChange={(checked) => {
                                daysField.onChange(checked ? 'todos_os_dias' : []);
                              }}
                            />
                            <Label htmlFor="todos_os_dias">Todos os dias</Label>
                          </div>
                          {daysField.value !== 'todos_os_dias' && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {DAYS_OF_WEEK.map((day) => (
                                <div key={day.key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={day.key}
                                    checked={Array.isArray(daysField.value) && daysField.value.includes(day.key)}
                                    onCheckedChange={(checked) => {
                                      const currentDays = Array.isArray(daysField.value) ? daysField.value : [];
                                      const newDays = checked
                                        ? [...currentDays, day.key]
                                        : currentDays.filter((d) => d !== day.key);
                                      daysField.onChange(newDays);
                                    }}
                                  />
                                  <Label htmlFor={day.key}>{day.label}</Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {reminderType === 'insulina' && (
                <>
                  <FormField control={form.control} name="insulinType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Insulina (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {INSULIN_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="insulinDose" render={({ field }) => (
                    <FormItem><FormLabel>Dose de Insulina (Opcional)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Ex: 5.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="isSimulatedCall" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Chamada Simulada</FormLabel>
                        <FormDescription>Receber uma notificação parecida com uma chamada.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}/>
                  {isSimulatedCallEnabled && (
                     <FormField control={form.control} name="simulatedCallContact" render={({ field }) => (
                      <FormItem><FormLabel>Nome do Contato (Chamada Simulada)</FormLabel><FormControl><Input placeholder="Ex: Mãe, Dr. Silva" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  )}
                </>
              )}
              {/* Placeholder for custom sound selection */}
              {/* <FormField control={form.control} name="customSound" render={({ field }) => (...)}/> */}
              <FormField control={form.control} name="enabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5"><FormLabel>Ativado</FormLabel><FormDescription>Este lembrete está ativo?</FormDescription></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}/>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : (editingReminder ? 'Atualizar Lembrete' : 'Salvar Lembrete')}
              </Button>
              {editingReminder && (
                <Button type="button" variant="outline" onClick={handleAddNew}>
                  Cancelar Edição / Novo
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Lembretes Atuais</CardTitle>
          <CardDescription>Gerencie seus lembretes configurados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {reminders.length === 0 && <p className="text-muted-foreground">Nenhum lembrete configurado.</p>}
          {reminders.map(rem => (
            <div key={rem.id} className={`p-4 border rounded-md ${rem.enabled ? 'opacity-100' : 'opacity-60 bg-muted/50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg flex items-center">
                    {rem.type === 'glicemia' ? <Bell className="mr-2 h-5 w-5 text-blue-500" /> : <Bell className="mr-2 h-5 w-5 text-green-500" />}
                    {rem.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(rem.time)} - {Array.isArray(rem.days) ? rem.days.join(', ') : 'Todos os dias'}
                  </p>
                  {rem.type === 'insulina' && (
                    <p className="text-xs text-muted-foreground">
                      {rem.insulinType && `${rem.insulinType}`} {rem.insulinDose && `- ${rem.insulinDose} unidades`}
                      {rem.isSimulatedCall && ` (Chamada Simulada: ${rem.simulatedCallContact || 'Contato Padrão'})`}
                    </p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rem)}><Edit3 size={16} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(rem.id)}><Trash2 size={16} /></Button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                 <Badge variant={rem.enabled ? "default" : "outline"}>{rem.enabled ? 'Ativo' : 'Inativo'}</Badge>
                  {/* Notification Example (Conceptual) */}
                  {rem.isSimulatedCall && rem.enabled && (
                    <div className="text-xs p-1 px-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md flex items-center">
                      <Phone size={12} className="mr-1"/> Chamada Simulada Ativa
                    </div>
                  )}
              </div>

            </div>
          ))}
           {reminders.length > 0 && !editingReminder && (
            <Button variant="outline" className="w-full mt-4" onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Configurar Novo Lembrete
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
