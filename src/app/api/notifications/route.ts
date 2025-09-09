import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')

    console.log('🔔 API: 알림 조회 요청, employeeId:', employeeId)

    if (!employeeId) {
      console.log('🔔 API: Employee ID 누락')
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // 직원 ID로 알림 조회 (최신순)
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        posts (
          id,
          title,
          content,
          created_at
        )
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    console.log('🔔 API: Supabase 조회 결과, error:', error, 'data:', notifications)

    if (error) {
      console.error('🔔 API: 알림 조회 오류:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    console.log('🔔 API: 반환할 알림 개수:', notifications?.length || 0)
    return NextResponse.json(notifications || [])
  } catch (error) {
    console.error('🔔 API: 알림 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 알림 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, message, type = 'info', post_id, target_employee_ids } = body

    if (!title || !message || !target_employee_ids || !Array.isArray(target_employee_ids)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 여러 직원에게 알림 생성
    const notifications = target_employee_ids.map((employee_id: number) => ({
      title,
      message,
      type,
      employee_id,
      post_id: post_id || null,
      is_read: false
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('알림 생성 오류:', error)
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications: data })
  } catch (error) {
    console.error('알림 생성 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
