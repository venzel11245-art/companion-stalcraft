import { NextResponse } from 'next/server'

export async function GET() {
  // Формируем URL для авторизации на EXBO
  const authUrl = new URL('https://exbo.net/oauth/authorize')
  
  // ВАЖНО: redirect_uri должен ТОЧНО совпадать с тем, что ты указал боту в /myapps
  authUrl.searchParams.set('client_id', process.env.STALZONE_CLIENT_ID || '')
  authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/api/stalzone-callback')
  authUrl.searchParams.set('scope', '')
  authUrl.searchParams.set('response_type', 'code')
  
  // Перенаправляем пользователя на страницу авторизации EXBO
  return NextResponse.redirect(authUrl.toString())
}