
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // Import the detailed Database type

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

/*
  GUIA DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE:

  Para criar as tabelas necessárias e configurar as Row Level Security (RLS) policies
  no seu projeto Supabase, por favor, consulte o arquivo:
  docs/supabase/SUPABASE_SETUP_GUIDE.md

  Este guia contém todos os scripts SQL e instruções detalhadas.
*/


