
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { MedicationLog } from '@/types';
import { getMedicationLogs, deleteMedicationLog } from '@/lib/storage';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Loader2, ClipboardPlus, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import MedicationLogForm from './MedicationLogForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function MedicationHistoryCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [selectedDayLogs, setSelectedDayLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<MedicationLog | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getMedicationLogs();
      setMedicationLogs(logs);
    } catch (error: any) {
      toast({ title: "Erro ao buscar registros de medicamentos", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (date && !isLoading) {
      const logsForDay = medicationLogs.filter(log => isSameDay(parseISO(log.timestamp), date));
      setSelectedDayLogs(logsForDay.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
    } else {
      setSelectedDayLogs([]);
    }
  }, [date, medicationLogs, isLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMedicationLog(id);
      toast({ title: "Registro apagado", description: "O registro de medicamento foi apagado." });
      fetchLogs();
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  };
  
  const handleEdit = (log: MedicationLog) => {
    setEditingLog(log);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingLog(null);
    fetchLogs();
  };

  const dayHasLogs = (day: Date): boolean => {
    return medicationLogs.some(log => isSameDay(parseISO(log.timestamp), day));
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Calendário de Medicamentos</CardTitle>
          <CardDescription>Carregando dados do calendário...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Medicamento</DialogTitle>
          </DialogHeader>
          <MedicationLogForm onFormSubmit={handleFormSubmit} initialData={editingLog || undefined} />
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-purple-600 flex items-center">
              <ClipboardPlus className="mr-2 h-6 w-6" /> Calendário de Medicamentos
            </CardTitle>
            <CardDescription>Selecione um dia para ver os detalhes. Dias com registros são destacados.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md "
              locale={ptBR}
              modifiers={{
                hasLogs: dayHasLogs,
              }}
              modifiersClassNames={{
                hasLogs: 'bg-purple-500/20 text-purple-700 rounded-full font-bold',
              }}
              components={{
                DayContent: ({ date: dayDate, displayMonth }) => {
                  const hasLog = dayHasLogs(dayDate);
                  const baseClasses = "w-full h-full flex items-center justify-center relative";
                  return (
                    <div className={baseClasses}>
                      {format(dayDate, 'd')}
                      {hasLog && isSameDay(dayDate, startOfDay(dayDate)) && displayMonth.getMonth() === dayDate.getMonth() && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500"></span>
                      )}
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-purple-600">
              Registros de {date ? format(date, 'dd MMMM yyyy', { locale: ptBR }) : 'Hoje'}
            </CardTitle>
            <Link href="/log/medication" passHref>
              <Button variant="outline" size="sm" className="mt-2 w-full border-purple-500 text-purple-500 hover:bg-purple-500/10">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Medicamento
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
            {selectedDayLogs.length > 0 ? (
              selectedDayLogs.map(log => (
                <div key={log.id} className="p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-semibold text-purple-700 capitalize">
                        {log.medication_name}
                      </p>
                       <p className="text-sm font-medium text-muted-foreground">{log.dosage}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(format(parseISO(log.timestamp), 'HH:mm'))}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(log)}>
                        <Edit3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(log.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  {log.notes && <p className="text-xs mt-1 text-muted-foreground italic">"{log.notes}"</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum registro de medicamento para este dia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
