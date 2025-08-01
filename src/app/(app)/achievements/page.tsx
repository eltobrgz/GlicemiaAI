
'use client';

import PageHeader from '@/components/PageHeader';
import { Award } from 'lucide-react';
import AchievementsList from '@/components/gamification/AchievementsList';
import { useEffect } from 'react';
import { checkAndUnlockAchievements } from '@/lib/storage';

export default function AchievementsPage() {

  useEffect(() => {
    // Ensure the latest achievements are checked when the user visits the page
    checkAndUnlockAchievements();
  }, [])

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
