'use client';

import InsightsDisplay from '@/components/insights/InsightsDisplay';
import PageHeader from '@/components/PageHeader';
import { checkAndUnlockAchievements } from '@/lib/storage';
import { useEffect } from 'react';

export default function InsightsPage() {
  useEffect(() => {
    // When the user visits this page, check if they unlocked the "FIRST_INSIGHT_VIEWED" achievement
    checkAndUnlockAchievements();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Insights da IA"
        description="Descubra padrões, tendências e receba dicas personalizadas para otimizar seu controle glicêmico."
      />
      <InsightsDisplay />
    </div>
  );
}
