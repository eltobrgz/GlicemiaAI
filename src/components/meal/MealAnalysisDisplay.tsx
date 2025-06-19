'use client';
import type { MealAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Utensils, Info, Lightbulb, CheckCircle } from 'lucide-react';

interface MealAnalysisDisplayProps {
  analysis: MealAnalysis;
}

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center text-lg text-primary">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm">
      {children}
    </CardContent>
  </Card>
);

export default function MealAnalysisDisplay({ analysis }: MealAnalysisDisplayProps) {
  return (
    <div className="space-y-6 mt-6 animate-fadeIn">
      {analysis.imageUrl && (
        <Card className="overflow-hidden shadow-lg" data-ai-hint="food meal">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Imagem da Refeição Analisada</CardTitle>
            {analysis.originalImageFileName && <CardDescription>Arquivo: {analysis.originalImageFileName}</CardDescription>}
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src={analysis.imageUrl}
              alt="Refeição analisada"
              width={400}
              height={300}
              className="rounded-md object-cover max-h-[400px]"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Identificação dos Alimentos" icon={Utensils} className="shadow-md">
          <p>{analysis.foodIdentification}</p>
        </SectionCard>

        <SectionCard title="Estimativa de Macronutrientes" icon={Info} className="shadow-md">
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Carboidratos:</strong> {analysis.macronutrientEstimates.carbohydrates.toFixed(1)}g</li>
            <li><strong>Proteínas:</strong> {analysis.macronutrientEstimates.protein.toFixed(1)}g</li>
            <li><strong>Gorduras:</strong> {analysis.macronutrientEstimates.fat.toFixed(1)}g</li>
          </ul>
        </SectionCard>
      </div>
      
      <SectionCard title="Impacto Glicêmico Estimado" icon={Lightbulb} className="shadow-md bg-accent/10">
         <p className="font-medium">{analysis.estimatedGlucoseImpact}</p>
      </SectionCard>

      <SectionCard title="Sugestão de Dose de Insulina" icon={CheckCircle} className="shadow-md bg-primary/10">
        <p className="font-semibold text-lg">{analysis.suggestedInsulinDose}</p>
        <p className="text-xs text-muted-foreground mt-1">Lembre-se: esta é uma sugestão. Sempre siga as orientações do seu profissional de saúde.</p>
      </SectionCard>
      
      <SectionCard title="Dicas de Melhoria para a Refeição" icon={Utensils} className="shadow-md">
        <p>{analysis.improvementTips}</p>
      </SectionCard>
    </div>
  );
}

// Add a simple fade-in animation to globals.css or tailwind.config.js if needed:
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
// Or use tailwindcss-animate classes if already configured
