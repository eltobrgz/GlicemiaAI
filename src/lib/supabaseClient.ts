
// src/lib/supabaseClient.ts
import { createBrowserClient, createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
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

// Cliente Supabase para o LADO DO CLIENTE (Browser)
// Este é um singleton que pode ser importado em qualquer componente de cliente.
// Ele gerencia a sessão no navegador.
let client: SupabaseClient<Database> | undefined

function getBrowserClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  )

  return client
}

// Função para criar um cliente Supabase no LADO DO SERVIDOR (Server Actions, Route Handlers)
// Esta função DEVE ser chamada dentro de cada Server Action ou Route Handler que precisar dela.
// Ela usa os cookies da requisição para autenticar o usuário.
function createServerClient() {
    // Import 'cookies' here, inside the server-only function
    const { cookies } = require('next/headers');
    const cookieStore = cookies()

    return createSupabaseServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
                cookieStore.set({ name, value: '', ...options })
            },
            },
        }
    )
}


export { getBrowserClient, createServerClient }

/*
  GUIA DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE:

  Para criar as tabelas necessárias e configurar as Row Level Security (RLS) policies
  no seu projeto Supabase, por favor, consulte o arquivo:
  docs/supabase/SUPABASE_SETUP_GUIDE.md

  Este guia contém todos os scripts SQL e instruções detalhadas.
*/
