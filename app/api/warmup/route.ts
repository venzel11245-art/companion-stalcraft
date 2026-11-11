import { NextResponse } from 'next/server'
import { startAutoCacheUpdate } from '@/lib/auto-update-cache'

let started = false

export async function GET() {
  if (!started) {
    startAutoCacheUpdate()
    started = true
    return NextResponse.json({ status: 'started', message: 'Auto-cache update started' })
  }
  
  return NextResponse.json({ status: 'already_running', message: 'Auto-cache already running' })
}