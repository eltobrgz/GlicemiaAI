
/**
 * @fileOverview A set of functions to be used as tools by the Genkit conversational agent.
 * These functions query the user's health data from Supabase.
 */
import { supabase } from './supabaseClient';
import { startOfDay, subDays, endOfDay, parseISO } from 'date-fns';
import { getUserProfile, getGlucoseReadings } from './storage';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Usuário não autenticado.');
  }
  return session.user.id;
}

// Tool to get the most recent glucose reading
export async function getMostRecentGlucoseReading() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('glucose_readings')
    .select('value, timestamp, level')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found, not an error
    console.error('Error fetching most recent glucose reading:', error);
    throw new Error('Falha ao buscar a última leitura de glicemia.');
  }
  return data ? { ...data, timestamp: data.timestamp } : null;
}

// Tool to get glucose readings in a date range
export async function getGlucoseReadingsInRange(params: { startDate: string, endDate: string }) {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
        .from('glucose_readings')
        .select('value, timestamp, level')
        .eq('user_id', userId)
        .gte('timestamp', params.startDate)
        .lte('timestamp', params.endDate)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching glucose readings in range:', error);
        throw new Error('Falha ao buscar as leituras de glicemia no período.');
    }
    return data.map(r => ({ ...r, timestamp: r.timestamp }));
}

// Tool to count readings by level over a number of days
export async function countReadingsByLevel(params: { days: number }) {
  const userProfile = await getUserProfile();
  if (!userProfile) {
      throw new Error("Perfil do usuário não encontrado para classificar leituras.");
  }

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, params.days - 1));
  
  const allReadings = await getGlucoseReadings(userProfile);
  const filteredReadings = allReadings.filter(r => {
      const readingDate = parseISO(r.timestamp);
      return readingDate >= startDate && readingDate <= endDate;
  });

  const counts = {
      low: 0,
      normal: 0,
      high: 0,
      veryHigh: 0,
  };

  filteredReadings.forEach(reading => {
      switch (reading.level) {
          case 'baixa':
              counts.low++;
              break;
          case 'normal':
              counts.normal++;
              break;
          case 'alta':
              counts.high++;
              break;
          case 'muito_alta':
              counts.veryHigh++;
              break;
      }
  });

  return counts;
}

