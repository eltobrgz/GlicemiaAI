
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ALL_ACHIEVEMENTS } from '@/config/constants';
import { getUserAchievements, getUserProfile } from '@/lib/storage';
import type { Achievement, UserAchievement, UserProfile } from '@/types';
import { Progress } from '@/components/ui/progress';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '../ui/separator';

export default function AchievementsList() {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const achievements = await getUserAchievements();
        setUserAchievements(achievements);
      } catch (error: any) {
        toast({
          title: "Erro ao buscar conquistas",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, [toast]);

  const achievementsData = useMemo(() => {
    return ALL_ACHIEVEMENTS.map(achDef => {
      const userAch = userAchievements.find(ua => ua.achievement_key === achDef.key);
      return {
        ...achDef,
        unlockedAt: userAch?.unlocked_at,
      };
    }).sort((a, b) => {
      // Unlocked achievements first, then by name
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      if (a.unlockedAt && b.unlockedAt) {
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [userAchievements]);
  
  const totalUnlocked = userAchievements.length;
  const totalPossible = ALL_ACHIEVEMENTS.length;
  const overallProgress = totalPossible > 0 ? (totalUnlocked / totalPossible) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando suas conquistas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Progresso Geral</CardTitle>
                <CardDescription>Você desbloqueou {totalUnlocked} de {totalPossible} conquistas disponíveis.</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={overallProgress} className="h-4" />
            </CardContent>
        </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievementsData.map((ach) => (
          <Card
            key={ach.key}
            className={`shadow-md transition-all duration-300 ${ach.unlockedAt ? 'border-2 border-primary bg-primary/5' : 'bg-card'}`}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className={`flex-shrink-0 rounded-lg p-3 ${ach.unlockedAt ? 'bg-primary' : 'bg-muted'}`}>
                  <ach.icon className={`h-8 w-8 ${ach.unlockedAt ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <CardTitle className={`${ach.unlockedAt ? 'text-primary' : 'text-foreground'}`}>{ach.name}</CardTitle>
                {!ach.unlockedAt && <span className="text-xs font-bold text-muted-foreground">BLOQUEADA</span>}
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${ach.unlockedAt ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.description}</p>
            </CardContent>
            {ach.unlockedAt && (
               <>
                <Separator />
                <CardContent className="pt-4">
                    <p className="text-xs text-green-600 font-semibold text-center">
                        Desbloqueado em {format(new Date(ach.unlockedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                </CardContent>
               </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
