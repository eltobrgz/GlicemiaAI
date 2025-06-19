
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlucoseHistoryCalendar from '@/components/glucose/GlucoseHistoryCalendar';
import InsulinHistoryCalendar from '@/components/insulin/InsulinHistoryCalendar';
import ActivityHistoryCalendar from '@/components/activity/ActivityHistoryCalendar'; // Novo
import { Droplet, Pill, Bike } from 'lucide-react'; // Bike adicionado

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || 'glucose';

  const onTabChange = (value: string) => {
    router.push(`/calendar?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário de Acompanhamento"
        description="Visualize suas medições de glicemia, registros de insulina e atividades físicas."
      />
      <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3"> {/* Alterado para 3 colunas */}
          <TabsTrigger value="glucose">
            <Droplet className="mr-2 h-4 w-4" />
            Glicemia
          </TabsTrigger>
          <TabsTrigger value="insulin">
            <Pill className="mr-2 h-4 w-4" />
            Insulina
          </TabsTrigger>
          <TabsTrigger value="activity"> {/* Nova aba */}
            <Bike className="mr-2 h-4 w-4" />
            Atividade
          </TabsTrigger>
        </TabsList>
        <TabsContent value="glucose">
          <GlucoseHistoryCalendar />
        </TabsContent>
        <TabsContent value="insulin">
          <InsulinHistoryCalendar />
        </TabsContent>
        <TabsContent value="activity"> {/* Novo conteúdo de aba */}
          <ActivityHistoryCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
