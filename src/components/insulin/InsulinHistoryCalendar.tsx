
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { InsulinLog } from '@/types';
import { getInsulinLogs, deleteInsulinLog } from '@/lib/storage';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Loader2, Pill, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import InsulinLogForm from './InsulinLogForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function InsulinHistoryCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [insulinLogs, setInsulinLogs] = useState<InsulinLog[]>([]);
  const [selectedDayLogs, setSelectedDayLogs] = useState<InsulinLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<InsulinLog | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getInsulinLogs();
      setInsulinLogs(logs);
    } catch (error: any) {
      toast({ title: "Erro ao buscar registros de insulina", description: error.message, variant: "destructive" });
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
      const logsForDay = insulinLogs.filter(log => isSameDay(parseISO(log.timestamp), date));
      setSelectedDayLogs(logsForDay.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
    } else {
      setSelectedDayLogs([]);
    }
  }, [date, insulinLogs, isLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteInsulinLog(id);
      toast({ title: "Registro apagado", description: "O registro de insulina foi apagado." });
      fetchLogs();
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (log: InsulinLog) => {
    setEditingLog(log);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingLog(null);
    fetchLogs();
  };

  const dayHasLogs = (day: Date): boolean => {
    return insulinLogs.some(log => isSameDay(parseISO(log.timestamp), day));
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Calendário de Insulina</CardTitle>
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
            <DialogTitle>Editar Registro de Insulina</DialogTitle>
          </DialogHeader>
          <InsulinLogForm onFormSubmit={handleFormSubmit} initialData={editingLog || undefined} />
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent flex items-center">
              <Pill className="mr-2 h-6 w-6" /> Calendário de Insulina
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
                hasLogs: 'bg-accent/20 text-accent-foreground rounded-full font-bold',
              }}
              components={{
                DayContent: ({ date: dayDate, displayMonth }) => {
                  const hasLog = dayHasLogs(dayDate);
                  const baseClasses = "w-full h-full flex items-center justify-center relative";
                  return (
                    <div className={baseClasses}>
                      {format(dayDate, 'd')}
                      {hasLog && isSameDay(dayDate, startOfDay(dayDate)) && displayMonth.getMonth() === dayDate.getMonth() && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-accent"></span>
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
            <CardTitle className="text-xl font-headline text-accent">
              Registros de {date ? format(date, 'dd MMMM yyyy', { locale: ptBR }) : 'Hoje'}
            </CardTitle>
            <Link href="/log/insulin" passHref>
              <Button variant="outline" size="sm" className="mt-2 w-full border-accent text-accent hover:bg-accent/10">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Registro de Insulina
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
            {selectedDayLogs.length > 0 ? (
              selectedDayLogs.map(log => (
                <div key={log.id} className="p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xl font-bold text-accent">
                        {log.dose} <span className="text-sm text-muted-foreground">unidades</span>
                      </p>
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
                  {log.type && <p className="text-sm mt-1 text-muted-foreground">Tipo: {log.type}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum registro de insulina para este dia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
