
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ActivityLog } from '@/types';
import { getActivityLogs, deleteActivityLog } from '@/lib/storage';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Loader2, Bike, Zap, Clock, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useLogDialog } from '@/contexts/LogDialogsContext';

export default function ActivityHistoryCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedDayLogs, setSelectedDayLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { openDialog, setInitialData, addSuccessListener } = useLogDialog();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getActivityLogs();
      setActivityLogs(logs);
    } catch (error: any) {
      toast({ title: "Erro ao buscar registros de atividade", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const unsubscribe = addSuccessListener('activity', fetchLogs);
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (date && !isLoading) {
      const logsForDay = activityLogs.filter(log => isSameDay(parseISO(log.timestamp), date));
      setSelectedDayLogs(logsForDay.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
    } else {
      setSelectedDayLogs([]);
    }
  }, [date, activityLogs, isLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteActivityLog(id);
      toast({ title: "Registro apagado", description: "O registro de atividade foi apagado." });
      fetchLogs();
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (log: ActivityLog) => {
    setInitialData('activity', log);
    openDialog('activity');
  };

  const handleAddNew = () => {
    setInitialData('activity', undefined);
    openDialog('activity');
  };

  const dayHasLogs = (day: Date): boolean => {
    return activityLogs.some(log => isSameDay(parseISO(log.timestamp), day));
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Calendário de Atividades</CardTitle>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-orange-500 flex items-center">
              <Bike className="mr-2 h-6 w-6" /> Calendário de Atividades Físicas
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
                hasLogs: 'bg-orange-500/20 text-orange-700 rounded-full font-bold',
              }}
              components={{
                DayContent: ({ date: dayDate, displayMonth }) => {
                  const hasLog = dayHasLogs(dayDate);
                  const baseClasses = "w-full h-full flex items-center justify-center relative";
                  return (
                    <div className={baseClasses}>
                      {format(dayDate, 'd')}
                      {hasLog && isSameDay(dayDate, startOfDay(dayDate)) && displayMonth.getMonth() === dayDate.getMonth() && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-orange-500"></span>
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
            <CardTitle className="text-xl font-headline text-orange-500">
              Registros de {date ? format(date, 'dd MMMM yyyy', { locale: ptBR }) : 'Hoje'}
            </CardTitle>
            <Button onClick={handleAddNew} variant="outline" size="sm" className="mt-2 w-full border-orange-500 text-orange-500 hover:bg-orange-500/10">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Registro de Atividade
            </Button>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
            {selectedDayLogs.length > 0 ? (
              selectedDayLogs.map(log => (
                <div key={log.id} className="p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-semibold text-orange-600 capitalize">
                        {log.activity_type.replace(/_/g, ' ')}
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
                  <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm">
                          <Clock size={14} className="mr-1.5 text-muted-foreground" /> Duração: {log.duration_minutes} min
                      </div>
                      {log.intensity && (
                          <div className="flex items-center text-sm capitalize">
                             <Zap size={14} className="mr-1.5 text-muted-foreground" /> Intensidade: <Badge variant="outline" className="ml-1.5 border-orange-400 text-orange-600">{log.intensity}</Badge>
                          </div>
                      )}
                  </div>
                  {log.notes && <p className="text-xs mt-1 text-muted-foreground italic">"{log.notes}"</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum registro de atividade para este dia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
