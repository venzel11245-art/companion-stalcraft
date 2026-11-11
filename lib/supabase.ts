import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Service key НЕ имеет префикса NEXT_PUBLIC_, поэтому в браузере он будет undefined (и это нормально!)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=========================================')
console.log('🔍 ПРОВЕРКА SUPABASE КЛЮЧЕЙ:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? `✅ Загружен (длина: ${supabaseAnonKey.length})` : '❌ НЕ ЗАГРУЖЕН')
console.log('Service Key:', supabaseServiceKey ? `✅ Загружен (длина: ${supabaseServiceKey.length})` : 'ℹ️ Не загружен в браузер (это нормально)')
console.log('=========================================')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Ключи Supabase не найдены! Проверь файл .env.local')
}

// 1. Клиент для браузера (используется в компонентах 'use client')
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Клиент для сервера (используется ТОЛЬКО в API роутах и Server Actions)
// Мы добавили проверку: если ключа нет (мы в браузере), не создаем клиент, чтобы не было ошибки
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null