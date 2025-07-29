
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { ReminderConfig } from '@/types';
import { getReminders, saveReminder, deleteReminder } from '@/lib/storage';
import { formatTime } from '@/lib/utils';
import { DAYS_OF_WEEK, INSULIN_TYPES } from '@/config/constants';
import { PlusCircle, Trash2, Bell, Phone, Loader2, Edit3, Info, CheckCircle, BellOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const reminderSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['glicemia', 'insulina']),
  name: z.string().min(1, 'Nome do lembrete é obrigatório.'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:MM).'),
  days: z.union([z.array(z.enum(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'])).min(1, "Selecione pelo menos um dia."), z.literal('todos_os_dias')]),
  enabled: z.boolean().default(true),
  insulinType: z.string().optional(),
  insulinDose: z.coerce.number().optional().or(z.literal('')),
  isSimulatedCall: z.boolean().optional(),
  simulatedCallContact: z.string().optional(),
  customSound: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export default function ReminderSetup() {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    fetchReminders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const fetchedReminders = await getReminders();
      setReminders(fetchedReminders);
    } catch (error: any) {
      toast({ title: "Erro ao buscar lembretes", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: "Navegador não suporta notificações", description: "Seu navegador não suporta notificações desktop.", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast({ title: "Permissão concedida!", description: "Você agora receberá notificações de lembretes." });
    } else if (permission === 'denied') {
      toast({ title: "Permissão negada", description: "As notificações foram bloqueadas. Você pode alterar isso nas configurações do seu navegador.", variant: "destructive" });
    }
  };


  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: 'glicemia',
      name: '',
      time: '08:00',
      days: 'todos_os_dias',
      enabled: true,
      insulinDose: '',
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
        insulinDose: editingReminder.insulinDose ?? '',
        isSimulatedCall: editingReminder.isSimulatedCall,
        simulatedCallContact: editingReminder.simulatedCallContact,
        customSound: editingReminder.customSound,
      });
    } else {
      form.reset({
        type: 'glicemia', name: '', time: '08:00', days: 'todos_os_dias', enabled: true,
        insulinType: '', insulinDose: '', isSimulatedCall: false, simulatedCallContact: '', customSound: ''
      });
    }
  }, [editingReminder, form]);

  const onSubmit = async (data: ReminderFormData) => {
    setIsSaving(true);
    try {
      const reminderToSave: Omit<ReminderConfig, 'id' | 'created_at' | 'user_id'> & { id?: string } = {
        id: data.id,
        ...data,
        insulinType: data.type === 'insulina' ? data.insulinType : undefined,
        insulinDose: data.type === 'insulina' && data.insulinDose !== '' ? Number(data.insulinDose) : undefined,
        isSimulatedCall: data.isSimulatedCall,
        simulatedCallContact: data.isSimulatedCall ? data.simulatedCallContact : undefined,
      };

      await saveReminder(reminderToSave);
      toast({
        title: editingReminder ? 'Lembrete Atualizado!' : 'Lembrete Salvo!',
        description: `Lembrete "${data.name}" foi ${editingReminder ? 'atualizado' : 'salvo'} com sucesso.`,
      });
      setEditingReminder(null); 
      fetchReminders(); 
    } catch (error: any) {
      toast({ title: "Erro ao salvar lembrete", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (reminder: ReminderConfig) => {
    setEditingReminder(reminder);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      toast({ title: 'Lembrete Apagado!', variant: 'default' });
      fetchReminders(); 
      if (editingReminder?.id === id) {
        setEditingReminder(null);
      }
    } catch (error: any) {
      toast({ title: "Erro ao apagar lembrete", description: error.message, variant: "destructive" });
    }
  };

  const handleAddNew = () => {
    setEditingReminder(null); 
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><Bell className="mr-2 h-6 w-6"/>Configuração de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {notificationPermission === 'default' && (
            <Alert variant="info">
              <Info className="h-4 w-4"/>
              <AlertTitle>Permitir Notificações</AlertTitle>
              <AlertDescription>
                Para receber alertas de lembretes, precisamos da sua permissão para enviar notificações.
                <Button onClick={requestNotificationPermission} className="mt-2 ml-auto block">Permitir Notificações</Button>
              </AlertDescription>
            </Alert>
          )}
          {notificationPermission === 'granted' && (
            <Alert variant="success">
               <CheckCircle className="h-4 w-4"/>
              <AlertTitle>Permissão Concedida</AlertTitle>
              <AlertDescription>
                Você está configurado para receber notificações de lembretes. Lembre-se de manter a aba do app aberta.
              </AlertDescription>
            </Alert>
          )}
          {notificationPermission === 'denied' && (
            <Alert variant="destructive">
               <BellOff className="h-4 w-4"/>
              <AlertTitle>Permissão Negada</AlertTitle>
              <AlertDescription>
                As notificações foram bloqueadas. Para habilitá-las, você precisará alterar as configurações de notificação do seu navegador para este site e então clicar em "Permitir Notificações" aqui novamente.
                 <Button onClick={requestNotificationPermission} className="mt-2 ml-auto block">Tentar Permitir Novamente</Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>


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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {INSULIN_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="insulinDose" render={({ field }) => (
                      <FormItem><FormLabel>Dose de Insulina (Opcional)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Ex: 5.5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </>
                )}
                <FormField control={form.control} name="isSimulatedCall" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" /> Chamada Simulada</FormLabel>
                      <FormDescription>Exibir a notificação com um estilo visual de "chamada telefônica" (não realiza uma chamada real).</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                {isSimulatedCallEnabled && (
                    <FormField control={form.control} name="simulatedCallContact" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Contato (Chamada Simulada)</FormLabel><FormControl><Input placeholder="Ex: Mãe, Dr. Silva" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                )}
                <FormField control={form.control} name="enabled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Ativado</FormLabel><FormDescription>Este lembrete está ativo?</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : (editingReminder ? 'Atualizar Lembrete' : 'Salvar Lembrete')}
                </Button>
                {editingReminder && (
                  <Button type="button" variant="outline" onClick={handleAddNew} disabled={isSaving}>
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
            {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {!isLoading && reminders.length === 0 && <p className="text-muted-foreground">Nenhum lembrete configurado.</p>}
            {!isLoading && reminders.map(rem => (
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
                      </p>
                    )}
                     {rem.isSimulatedCall && rem.enabled && (
                      <p className="text-xs text-muted-foreground">
                        Chamada simulada para: {rem.simulatedCallContact || 'Contato Padrão'}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rem)}><Edit3 size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(rem.id)}><Trash2 size={16} /></Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={rem.enabled ? "default" : "outline"}>{rem.enabled ? 'Ativo' : 'Inativo'}</Badge>
                    {rem.isSimulatedCall && rem.enabled && (
                      <div className="text-xs p-1 px-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md flex items-center">
                        <Phone size={12} className="mr-1"/> Chamada Simulada Ativa (Texto)
                      </div>
                    )}
                </div>

              </div>
            ))}
            {!isLoading && reminders.length > 0 && !editingReminder && (
              <Button variant="outline" className="w-full mt-4" onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Configurar Novo Lembrete
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
