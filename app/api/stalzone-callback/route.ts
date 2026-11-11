import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.json({ 
      error: 'No authorization code received',
      url: request.url 
    }, { status: 400 })
  }

  console.log(' Получен код авторизации:', code)

  // Обмениваем код на токен
  try {
    const tokenResponse = await fetch('https://exbo.net/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.STALZONE_CLIENT_ID || '',
        client_secret: process.env.STALZONE_CLIENT_SECRET || '',
        code: code,
        redirect_uri: 'http://localhost:3000/api/stalzone-callback',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error(' Ошибка получения токена:', error)
      return NextResponse.json({ 
        error: 'Failed to get token', 
        details: error 
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    
    console.log('✅ Токен получен!')
    console.log('Access Token:', tokenData.access_token)
    
    // Показываем токен пользователю
    return NextResponse.json({
      message: '✅ Токен успешно получен!',
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      instructions: 'Скопируй access_token и добавь в .env файл как STALZONE_ACCESS_TOKEN',
    })
  } catch (error) {
    console.error('❌ Ошибка:', error)
    return NextResponse.json({ 
      error: 'Error exchanging code for token', 
      details: error 
    }, { status: 500 })
  }
}