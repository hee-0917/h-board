import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

// 캘린더 이벤트 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    const employee_id = searchParams.get('employee_id')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const export_excel = searchParams.get('export_excel')
    
    console.log('📅 캘린더 이벤트 조회 요청:', { department_id, employee_id, year, month, export_excel })

    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: true })

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
      // 해당 월의 마지막 날을 정확히 계산
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    // 연차, 반차, 1/4차만 필터링 (엑셀 다운로드용)
    if (export_excel) {
      query = query.in('type', ['annual_leave', 'half_day', 'quarter_day'])
    }

    const { data, error } = await query

    if (error) {
      console.error('캘린더 이벤트 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 엑셀 다운로드 요청인 경우
    if (export_excel) {
      const excelData = await generateExcelData(supabase, data || [])
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(excelData)
      XLSX.utils.book_append_sheet(workbook, worksheet, '휴가현황')
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      const fileName = `vacation_report_${year || new Date().getFullYear()}_${month ? String(month).padStart(2, '0') : 'all'}.xlsx`
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      })
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

// 엑셀 데이터 생성 헬퍼 함수
async function generateExcelData(supabase: any, events: any[]): Promise<string[][]> {
  const header = ['사번', '이름', '날짜', '연차', '반차', '1/4차']
  
  // 고유한 employee_id 목록 추출
  const employeeIds = [...new Set(events.map(event => event.employee_id))]
  
  // 직원 정보를 별도로 조회
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, employee_id, name')
    .in('id', employeeIds)
  
  if (employeeError) {
    console.error('직원 정보 조회 오류:', employeeError)
  }
  
  // employee_id를 키로 하는 직원 정보 맵 생성
  const employeeMap: { [key: number]: { employee_id: string, name: string } } = {}
  if (employees) {
    employees.forEach((emp: any) => {
      employeeMap[emp.id] = { employee_id: emp.employee_id, name: emp.name }
    })
  }
  
  // 직원별 날짜별로 데이터 그룹화
  const groupedData: { [key: string]: { [date: string]: { annual: boolean, half: boolean, quarter: boolean } } } = {}
  
  events.forEach(event => {
    const employee = employeeMap[event.employee_id]
    const employeeId = employee?.employee_id || event.employee_id.toString()
    const name = employee?.name || '이름없음'
    const key = `${employeeId}_${name}`
    const date = event.date
    
    if (!groupedData[key]) {
      groupedData[key] = {}
    }
    
    if (!groupedData[key][date]) {
      groupedData[key][date] = { annual: false, half: false, quarter: false }
    }
    
    switch (event.type) {
      case 'annual_leave':
        groupedData[key][date].annual = true
        break
      case 'half_day':
        groupedData[key][date].half = true
        break
      case 'quarter_day':
        groupedData[key][date].quarter = true
        break
    }
  })
  
  // 엑셀 데이터 배열 생성
  const rows: string[][] = [header]
  
  Object.keys(groupedData).forEach(employeeKey => {
    const [employeeId, name] = employeeKey.split('_')
    const dates = groupedData[employeeKey]
    
    Object.keys(dates).sort().forEach(date => {
      const dateData = dates[date]
      rows.push([
        employeeId,
        name,
        'D', // 날짜를 D로 일괄 표기
        dateData.annual ? 'Y' : '',
        dateData.half ? 'Y/2' : '',
        dateData.quarter ? '1/4' : ''
      ])
    })
  })
  
  return rows
}