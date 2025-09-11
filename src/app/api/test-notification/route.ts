import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 테스트용 알림 생성 API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { employee_id } = await request.json()

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 })
    }

    // 테스트 알림 생성
    const testNotification = {
      employee_id: parseInt(employee_id),
      title: '🔔 테스트 알림',
      message: '알림 시스템이 정상적으로 작동하는지 확인하는 테스트 알림입니다.',
      type: 'info',
      is_read: false
    }

    console.log('🔔 테스트 알림 생성 시도:', testNotification)

    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (error) {
      console.error('🔔 테스트 알림 생성 오류:', error)
      return NextResponse.json({ error: '테스트 알림 생성 실패', details: error }, { status: 500 })
    }

    console.log('🔔 테스트 알림 생성 성공:', data)
    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('🔔 테스트 알림 생성 중 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}