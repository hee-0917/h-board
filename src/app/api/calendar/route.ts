import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 캘린더 이벤트 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    const employee_id = searchParams.get('employee_id')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    console.log('📅 캘린더 이벤트 조회 요청:', { department_id, employee_id, year, month })

    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: false })

    // 부서별 필터링
    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    // 직원별 필터링
    if (employee_id) {
      query = query.eq('employee_id', employee_id)
    }

    // 월별 필터링
    if (year && month) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('캘린더 이벤트 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📅 캘린더 이벤트 조회 성공, 개수:', data?.length || 0)
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('캘린더 API 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 캘린더 이벤트 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    console.log('📅 캘린더 POST API 호출됨')
    const body = await request.json()
    console.log('📅 요청 body:', body)
    const { title, type, date, description, employee_id, department_id } = body

    console.log('📅 캘린더 이벤트 생성 요청:', { title, type, date, employee_id, department_id })

    // 데이터 검증
    if (!title || !type || !date || !employee_id || !department_id) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 캘린더 이벤트 생성
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        title,
        type,
        date,
        description,
        employee_id,
        department_id,
        status: 'approved' // 기본값을 승인으로 설정
      })
      .select('*')
      .single()

    if (eventError) {
      console.error('캘린더 이벤트 생성 오류:', eventError)
      return NextResponse.json({ error: eventError.message }, { status: 500 })
    }

    console.log('✅ 캘린더 이벤트 생성 성공:', eventData?.id)
    return NextResponse.json(eventData)

  } catch (error) {
    console.error('캘린더 이벤트 생성 API 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 캘린더 이벤트 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, title, type, date, description, status } = body

    console.log('📅 캘린더 이벤트 수정 요청:', { id, title, type, date, status })

    if (!id) {
      return NextResponse.json(
        { error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (type !== undefined) updateData.type = type
    if (date !== undefined) updateData.date = date
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('캘린더 이벤트 수정 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ 캘린더 이벤트 수정 성공:', id)
    return NextResponse.json(data)

  } catch (error) {
    console.error('캘린더 이벤트 수정 API 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 캘린더 이벤트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    console.log('📅 캘린더 이벤트 삭제 요청:', id)

    if (!id) {
      return NextResponse.json(
        { error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('캘린더 이벤트 삭제 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ 캘린더 이벤트 삭제 성공:', id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('캘린더 이벤트 삭제 API 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}