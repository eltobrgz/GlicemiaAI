import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GlucoseReading } from "@/types";
import { GLUCOSE_THRESHOLDS } from "@/config/constants";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classifyGlucoseLevel(value: number): GlucoseReading['level'] {
  if (value < GLUCOSE_THRESHOLDS.low) return 'baixa';
  if (value <= GLUCOSE_THRESHOLDS.normalIdealMax) return 'normal';
  if (value <= GLUCOSE_THRESHOLDS.high) return 'alta';
  return 'muito_alta';
}

export function getGlucoseLevelColor(level?: GlucoseReading['level']): string {
  switch (level) {
    case 'baixa':
      return 'text-blue-500'; // Or some other color like orange for caution
    case 'normal':
      return 'text-green-500';
    case 'alta':
      return 'text-yellow-500';
    case 'muito_alta':
      return 'text-red-500';
    default:
      return 'text-foreground';
  }
}

export function formatDateTime(isoString: string): string {
  try {
    return format(new Date(isoString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch (error) {
    return "Data inválida";
  }
}

export function formatDate(isoString: string): string {
   try {
    return format(new Date(isoString), "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    return "Data inválida";
  }
}

export function formatTime(timeString: string): string { // Expects "HH:mm"
  if (!timeString || !timeString.includes(':')) return "Hora inválida";
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  try {
    return format(date, "HH:mm", { locale: ptBR });
  } catch (error) {
    return "Hora inválida";
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper to convert file to Base64 Data URI
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
