
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { GlucoseReading, UserProfile } from '@/types';
import { getGlucoseReadings, deleteGlucoseReading, getUserProfile } from '@/lib/storage';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getGlucoseLevelColor, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Loader2, Edit3, Droplet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLogDialog } from '@/contexts/LogDialogsContext';

export default function GlucoseHistoryCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [selectedDayReadings, setSelectedDayReadings] = useState<GlucoseReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const { openDialog, setInitialData, addSuccessListener } = useLogDialog();

  const fetchReadingsAndProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      const readings = await getGlucoseReadings(profile); // Pass profile
      setGlucoseReadings(readings);
    } catch (error: any) {
      toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadingsAndProfile();
    const unsubscribe = addSuccessListener('glucose', fetchReadingsAndProfile);
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (date && !isLoading) {
      const readingsForDay = glucoseReadings.filter(r => isSameDay(parseISO(r.timestamp), date));
      setSelectedDayReadings(readingsForDay.sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
    } else {
      setSelectedDayReadings([]);
    }
  }, [date, glucoseReadings, isLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteGlucoseReading(id);
      toast({ title: "Registro apagado", description: "O registro de glicemia foi apagado." });
      fetchReadingsAndProfile();
    } catch (error: any) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    }
  };
  
  const handleEdit = (reading: GlucoseReading) => {
    setInitialData('glucose', reading);
    openDialog('glucose');
  };
  
  const handleAddNew = () => {
    setInitialData('glucose', undefined);
    openDialog('glucose');
  };

  const dayHasReadings = (day: Date): boolean => {
    return glucoseReadings.some(r => isSameDay(parseISO(r.timestamp), day));
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Calendário Glicêmico</CardTitle>
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
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
              <Droplet className="mr-2 h-6 w-6" /> Calendário Glicêmico
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
                hasReadings: dayHasReadings 
              }}
              modifiersClassNames={{
                hasReadings: 'bg-primary/10 text-primary rounded-full font-bold',
              }}
              components={{
                DayContent: ({ date: dayDate, displayMonth }) => {
                  const hasReading = dayHasReadings(dayDate);
                  const baseClasses = "w-full h-full flex items-center justify-center relative";
                 
                  return (
                    <div className={baseClasses}>
                      {format(dayDate, 'd')}
                      {hasReading && isSameDay(dayDate, startOfDay(dayDate)) && displayMonth.getMonth() === dayDate.getMonth() && (
                         <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-primary"></span>
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
            <CardTitle className="text-xl font-headline text-primary">
              Registros de {date ? format(date, 'dd MMMM yyyy', { locale: ptBR }) : 'Hoje'}
            </CardTitle>
             <Button onClick={handleAddNew} variant="outline" size="sm" className="mt-2 w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Registro de Glicemia
              </Button>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
            {selectedDayReadings.length > 0 ? (
              selectedDayReadings.map(reading => (
                <div key={reading.id} className="p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-2xl font-bold ${getGlucoseLevelColor(reading.level, userProfile || undefined)}`}>
                        {reading.value} <span className="text-sm text-muted-foreground">mg/dL</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(format(parseISO(reading.timestamp), 'HH:mm'))}</p>
                    </div>
                    <div className="flex space-x-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(reading)}>
                        <Edit3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(reading.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  {reading.mealContext && <Badge variant="outline" className="mt-1 text-xs capitalize">{reading.mealContext.replace('_', ' ')}</Badge>}
                  {reading.notes && <p className="text-xs mt-1 text-muted-foreground italic">"{reading.notes}"</p>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum registro para este dia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
