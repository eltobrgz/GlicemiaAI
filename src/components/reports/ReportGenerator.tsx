
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, FileSearch, Download } from 'lucide-react';
import type { GlucoseReading, InsulinLog, UserProfile, ActivityLog, MealAnalysis, MedicationLog } from '@/types';
import { getGlucoseReadings, getInsulinLogs, getUserProfile, getActivityLogs, getMealAnalyses, getMedicationLogs } from '@/lib/storage';
import ReportView, { type ReportData } from '@/components/reports/ReportView';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type PeriodOption = 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

const periodOptions: { value: PeriodOption; label: string }[] = [
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Este Mês' },
  { value: 'lastMonth', label: 'Mês Anterior' },
  { value: 'custom', label: 'Personalizado' },
];

export default function ReportGenerator() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('last7');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        toast({ title: 'Erro ao carregar perfil', description: 'Não foi possível carregar dados do perfil para os relatórios.', variant: 'destructive' });
      }
    };
    fetchProfile();
  }, [toast]);

  const calculateDateRange = useCallback((): DateRange | undefined => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'last7':
        return { from: subDays(today, 6), to: today };
      case 'last30':
        return { from: subDays(today, 29), to: today };
      case 'thisMonth':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subDays(today, today.getDate() + 1));
        return { from: lastMonthStart, to: endOfMonth(lastMonthStart) };
      case 'custom':
        return customDateRange;
      default:
        return undefined;
    }
  }, [selectedPeriod, customDateRange]);


  const handleGenerateReport = async () => {
    const range = calculateDateRange();
    if (!range?.from || !range?.to) {
      toast({ title: 'Período Inválido', description: 'Por favor, selecione um período válido.', variant: 'destructive' });
      return;
    }
    if (!userProfile) {
      toast({ title: 'Perfil não carregado', description: 'Aguarde o carregamento do perfil do usuário.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      const [allGlucoseReadings, allInsulinLogs, allActivityLogs, allMealAnalyses, allMedicationLogs] = await Promise.all([
        getGlucoseReadings(userProfile),
        getInsulinLogs(),
        getActivityLogs(),
        getMealAnalyses(),
        getMedicationLogs(),
      ]);

      const filteredGlucose = allGlucoseReadings.filter(r => {
        const rDate = parseISO(r.timestamp);
        return rDate >= range.from! && rDate <= range.to!;
      });
      const filteredInsulin = allInsulinLogs.filter(l => {
        const lDate = parseISO(l.timestamp);
        return lDate >= range.from! && lDate <= range.to!;
      });
      const filteredActivityLogs = allActivityLogs.filter(log => {
        const logDate = parseISO(log.timestamp);
        return logDate >= range.from! && logDate <= range.to!;
      });
      const filteredMealAnalyses = allMealAnalyses.filter(meal => {
        const mealDate = parseISO(meal.timestamp);
        return mealDate >= range.from! && mealDate <= range.to!;
      });
      const filteredMedicationLogs = allMedicationLogs.filter(log => {
        const logDate = parseISO(log.timestamp);
        return logDate >= range.from! && logDate <= range.to!;
      });


      let averageGlucose: number | null = null;
      let minGlucose: { value: number; timestamp: string } | null = null;
      let maxGlucose: { value: number; timestamp: string } | null = null;
      let stdDevGlucose: number | null = null;
      let glucoseCV: number | null = null;
      let timeInTargetPercent: number | null = null;
      let timeBelowTargetPercent: number | null = null;
      let timeAboveTargetPercent: number | null = null;
      let countHypo = 0;
      let countNormal = 0;
      let countHigh = 0;
      let countVeryHigh = 0;

      if (filteredGlucose.length > 0) {
        const sum = filteredGlucose.reduce((acc, r) => acc + r.value, 0);
        averageGlucose = sum / filteredGlucose.length;

        minGlucose = filteredGlucose.reduce((min, r) => (r.value < min.value ? r : min), filteredGlucose[0]);
        maxGlucose = filteredGlucose.reduce((max, r) => (r.value > max.value ? r : max), filteredGlucose[0]);
        
        if (filteredGlucose.length > 1) {
          const mean = averageGlucose;
          const variance = filteredGlucose.reduce((acc, r) => acc + Math.pow(r.value - mean, 2), 0) / (filteredGlucose.length -1);
          stdDevGlucose = Math.sqrt(variance);
           if (averageGlucose && averageGlucose > 0) {
            glucoseCV = (stdDevGlucose / averageGlucose) * 100;
          }
        }

        // Use classified levels which are based on user's profile goals
        filteredGlucose.forEach(r => {
            if (r.level === 'baixa') countHypo++;
            else if (r.level === 'normal') countNormal++;
            else if (r.level === 'alta') countHigh++;
            else if (r.level === 'muito_alta') countVeryHigh++;
        });
        
        const totalInRange = countHypo + countNormal + countHigh + countVeryHigh;
        if (totalInRange > 0) {
            timeBelowTargetPercent = (countHypo / totalInRange) * 100;
            timeInTargetPercent = (countNormal / totalInRange) * 100;
            timeAboveTargetPercent = ((countHigh + countVeryHigh) / totalInRange) * 100;
        }
      }

      let totalInsulin: number | null = null;
      let averageDailyInsulin: number | null = null;
      if (filteredInsulin.length > 0) {
        totalInsulin = filteredInsulin.reduce((acc, log) => acc + log.dose, 0);
        const numberOfDays = differenceInDays(range.to!, range.from!) + 1;
        averageDailyInsulin = totalInsulin / numberOfDays;
      }

      const totalActivities = filteredActivityLogs.length;
      const totalActivityDuration = totalActivities > 0 ? filteredActivityLogs.reduce((sum, log) => sum + log.duration_minutes, 0) : null;
      const averageActivityDuration = totalActivities > 0 && totalActivityDuration !== null ? totalActivityDuration / totalActivities : null;

      const totalMealAnalyses = filteredMealAnalyses.length;
      const averageMealCarbs = totalMealAnalyses > 0 ? filteredMealAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.carbohydrates, 0) / totalMealAnalyses : null;
      const averageMealProtein = totalMealAnalyses > 0 ? filteredMealAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.protein, 0) / totalMealAnalyses : null;
      const averageMealFat = totalMealAnalyses > 0 ? filteredMealAnalyses.reduce((sum, meal) => sum + meal.macronutrientEstimates.fat, 0) / totalMealAnalyses : null;

      setReportData({
        period: { start: range.from, end: range.to },
        glucoseReadings: filteredGlucose,
        insulinLogs: filteredInsulin,
        activityLogs: filteredActivityLogs,
        mealAnalyses: filteredMealAnalyses,
        medicationLogs: filteredMedicationLogs,
        userProfile,
        summary: {
          averageGlucose,
          minGlucose,
          maxGlucose,
          stdDevGlucose,
          glucoseCV,
          timeInTargetPercent,
          timeBelowTargetPercent,
          timeAboveTargetPercent,
          countHypo,
          countNormal,
          countHigh,
          countVeryHigh,
          totalInsulin,
          averageDailyInsulin,
          insulinApplications: filteredInsulin.length,
          totalActivities,
          totalActivityDuration,
          averageActivityDuration,
          totalMealAnalyses,
          averageMealCarbs,
          averageMealProtein,
          averageMealFat,
          totalMedications: filteredMedicationLogs.length,
        },
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({ title: 'Erro ao Gerar Relatório', description: 'Não foi possível processar os dados para o relatório.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast({ title: 'Nenhum relatório para exportar', description: 'Gere um relatório primeiro.', variant: 'warning' });
      return;
    }
    setIsExportingPDF(true);
    try {
      const reportElement = document.getElementById('report-content-to-export');
      if (!reportElement) {
        toast({ title: 'Erro ao Exportar', description: 'Não foi possível encontrar o conteúdo do relatório para exportar.', variant: 'destructive' });
        setIsExportingPDF(false);
        return;
      }

      // Add a class to chart containers to control their size during export
      const charts = reportElement.querySelectorAll('.recharts-responsive-container');
      charts.forEach(chart => chart.classList.add('fixed-chart-size-for-pdf'));

      const canvas = await html2canvas(reportElement, {
        scale: 2, 
        useCORS: true,
        logging: false,
        onclone: (documentClone) => {
          const reportElementClone = documentClone.getElementById('report-content-to-export');
          if (reportElementClone) {
            // Apply a class to force light theme styles specifically for PDF context
            reportElementClone.classList.add('pdf-export-force-light');
            // Ensure the main report element in the clone has a white background for PDF
            reportElementClone.style.backgroundColor = '#FFFFFF';
            reportElementClone.style.padding = '20px'; // Add some padding if desired

            // Specifically make card backgrounds white in the clone for PDF
            const cardElements = reportElementClone.querySelectorAll('.shadow-md, .shadow-lg'); // Assuming cards have shadow classes
             cardElements.forEach((card: any) => {
                card.classList.add('card-pdf-bg'); // Uses the .pdf-export-force-light .card-pdf-bg style
             });
          }
        }
      });
      
      // Remove the sizing class after canvas creation
      charts.forEach(chart => chart.classList.remove('fixed-chart-size-for-pdf'));

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = canvasWidth / pdfWidth;
      const pdfImageHeight = canvasHeight / ratio;

      let position = 0;
      let page = 1;
      
      while (position < pdfImageHeight) {
        if (page > 1) {
            pdf.addPage();
        }
        // Calculate the portion of the image to add to the current page
        const sourceY = (position / pdfImageHeight) * canvasHeight;
        const sourceHeight = Math.min((pdfHeight / pdfImageHeight) * canvasHeight, canvasHeight - sourceY);
        const destinationHeight = (sourceHeight / canvasHeight) * pdfImageHeight;

        // Create a temporary canvas for the current page's slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = sourceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');
        
        if (sliceCtx) {
            sliceCtx.drawImage(canvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight);
            const pageImgData = sliceCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, destinationHeight);
        }
        
        position += pdfHeight;
        page++;
      }

      pdf.save(`GlicemiaAI_Relatorio_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'PDF Exportado', description: 'Seu relatório foi exportado com sucesso.' });

    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({ title: 'Erro ao Exportar PDF', description: 'Não foi possível gerar o arquivo PDF.', variant: 'destructive' });
    } finally {
      setIsExportingPDF(false);
    }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Configurar Relatório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecionar Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPeriod === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      `${format(customDateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(customDateRange.to, 'dd/MM/yy', { locale: ptBR })}`
                    ) : (
                      format(customDateRange.from, 'dd/MM/yy', { locale: ptBR })
                    )
                  ) : (
                    <span>Escolha as datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  initialFocus
                  locale={ptBR}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleGenerateReport} disabled={isLoading || !userProfile || isExportingPDF} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
            {isLoading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            <Button onClick={handleExportPDF} disabled={isLoading || !reportData || isExportingPDF} variant="outline" className="w-full sm:w-auto">
            {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExportingPDF ? 'Exportando...' : 'Exportar para PDF'}
            </Button>
        </div>
      </CardContent>

      {isLoading && (
        <div className="p-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Processando dados do relatório...</p>
        </div>
      )}
      
      <div id="report-content-to-export" className="bg-background">
        {reportData && !isLoading && (
            <ReportView data={reportData} />
        )}
       </div>
    </Card>
  );
}
