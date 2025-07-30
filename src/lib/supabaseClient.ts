// src/lib/supabaseClient.ts
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/supabase'

// Validação das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Este é um singleton para garantir que não recriamos o cliente desnecessariamente.
let supabaseClient: SupabaseClient<Database> | undefined

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(
      supabaseUrl!,
      supabaseAnonKey!
    )
  }
  return supabaseClient
}


/*
  GUIA DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE:

  Para criar as tabelas necessárias e configurar as Row Level Security (RLS) policies
  no seu projeto Supabase, por favor, consulte o arquivo:
  docs/supabase/SUPABASE_SETUP_GUIDE.md

  Este guia contém todos os scripts SQL e instruções detalhadas.
*/
