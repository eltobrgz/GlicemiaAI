
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/types';
import { GLUCOSE_THRESHOLDS } from '@/config/constants';
import { Loader2, Target } from 'lucide-react';

const goalsSchema = z.object({
  hypo_glucose_threshold: z.coerce.number().min(40, "Deve ser >= 40").max(100, "Deve ser <= 100"),
  target_glucose_low: z.coerce.number().min(50, "Deve ser >= 50").max(120, "Deve ser <= 120"),
  target_glucose_high: z.coerce.number().min(120, "Deve ser >= 120").max(250, "Deve ser <= 250"),
  hyper_glucose_threshold: z.coerce.number().min(180, "Deve ser >= 180").max(400, "Deve ser <= 400"),
}).refine(data => data.target_glucose_low < data.target_glucose_high, {
    message: "O início da faixa alvo deve ser menor que o fim.",
    path: ['target_glucose_low'],
});

type GoalsFormData = z.infer<typeof goalsSchema>;

interface WelcomeGoalsModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: (goalsUpdated: boolean) => void;
}

export default function WelcomeGoalsModal({ userProfile, isOpen, onClose }: WelcomeGoalsModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<GoalsFormData>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      hypo_glucose_threshold: GLUCOSE_THRESHOLDS.low,
      target_glucose_low: GLUCOSE_THRESHOLDS.low,
      target_glucose_high: GLUCOSE_THRESHOLDS.normalIdealMax,
      hyper_glucose_threshold: GLUCOSE_THRESHOLDS.high,
    }
  });

  const onSubmit = async (data: GoalsFormData) => {
    setIsSaving(true);
    try {
      const profileToUpdate: UserProfile = {
        ...userProfile,
        ...data,
      };
      await saveUserProfile(profileToUpdate);
      toast({ title: "Metas Salvas!", description: "Suas metas glicêmicas foram configuradas com sucesso." });
      onClose(true); // Indicate that goals were updated
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-headline">
            <Target className="mr-2 h-6 w-6 text-primary" /> Bem-vindo(a) ao GlicemiaAI!
          </DialogTitle>
          <DialogDescription>
            Para começar, vamos configurar suas metas glicêmicas. Estes valores, definidos com seu médico, nos ajudam a personalizar sua experiência.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="hypo_glucose_threshold"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Hipoglicemia</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder={`${GLUCOSE_THRESHOLDS.low}`} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="hyper_glucose_threshold"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Hiperglicemia</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder={`${GLUCOSE_THRESHOLDS.high}`} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="target_glucose_low"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Início do Alvo</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder={`${GLUCOSE_THRESHOLDS.low}`} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="target_glucose_high"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fim do Alvo</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder={`${GLUCOSE_THRESHOLDS.normalIdealMax}`} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <DialogFooter className="sm:justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => onClose(false)} disabled={isSaving}>
                Definir Mais Tarde
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Metas
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
