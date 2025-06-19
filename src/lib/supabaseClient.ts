
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Tipagem para o seu banco de dados (opcional, mas recomendado para type safety)
// Você pode gerar isso automaticamente com 'supabase gen types typescript > src/types/supabase.ts'
// Por enquanto, usaremos um tipo genérico.
export interface Database {
  // Defina seus esquemas, tabelas, colunas e RLS aqui.
  // Exemplo:
  // public: {
  //   Tables: {
  //     profiles: {
  //       Row: { id: string; name: string | null; email: string | null; ... }; // Linha como ela é no DB
  //       Insert: { id: string; name?: string | null; email?: string | null; ... }; // O que você insere
  //       Update: { name?: string | null; email?: string | null; ... }; // O que você atualiza
  //     };
  //   };
  // };
  // Por enquanto, deixaremos genérico para o cliente funcionar.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [schema: string]: any;
}


export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
