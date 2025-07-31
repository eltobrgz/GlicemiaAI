
'use client';

import PageHeader from '@/components/PageHeader';
import { Award } from 'lucide-react';
import AchievementsList from '@/components/gamification/AchievementsList';

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Conquistas"
        description="Acompanhe seu progresso e celebre suas vitórias na jornada de gerenciamento do diabetes."
      />
      <AchievementsList />
    </div>
  );
}
