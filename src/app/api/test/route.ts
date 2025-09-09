import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return NextResponse.json({
      status: 'success',
      message: 'API is working',
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
