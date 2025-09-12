import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as ExcelJS from 'exceljs'

// 캘린더 엑셀 다운로드 전용 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    console.log('📊 엑셀 다운로드 요청:', { department_id, year, month })

    let query = supabase
      .from('calendar_events')
      .select('*')
      .in('type', ['annual_leave', 'half_day', 'quarter_day'])
      .order('date', { ascending: true })

    // 부서별 필터링
    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    // 월별 필터링
    if (year && month) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('엑셀 다운로드 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 직원 정보를 별도로 조회
    const employeeIds = [...new Set((data || []).map(event => event.employee_id))]
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

    // ExcelJS로 엑셀 생성
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('vacation_report')
    
    // 엑셀 데이터 생성 및 색상 적용
    await generateExcelWithColors(worksheet, data || [], employeeMap, year || new Date().getFullYear().toString(), month || '1')
    
    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `vacation_report_${year || new Date().getFullYear()}_${month ? String(month).padStart(2, '0') : 'all'}.xlsx`
    
    console.log('📊 엑셀 다운로드 성공, 파일명:', fileName)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('엑셀 다운로드 API 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ExcelJS로 색상이 적용된 엑셀 생성
async function generateExcelWithColors(worksheet: ExcelJS.Worksheet, events: any[], employeeMap: { [key: number]: { employee_id: string, name: string } }, year: string, month: string) {
  // 직원 목록 추출
  const employeeList = Object.values(employeeMap)
  
  // 요일 이름 배열
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  
  // 1. 제목 행 (1행)
  worksheet.getCell('A1').value = `${year}년 ${month}월 확정 근무표`
  worksheet.mergeCells('A1:AO1') // 넓게 병합
  worksheet.getCell('A1').font = { size: 14, bold: true }
  worksheet.getCell('A1').alignment = { horizontal: 'center' }
  
  // 2-4. 빈 행들 (서명란)
  
  // 5. 부서명과 범례 행
  worksheet.getCell('A5').value = '검사예약센터'
  worksheet.getCell('C5').value = '연차:Y, 반차:Y/2, 오프:O, 반오프:O/2, 휴가:H'
  
  // 6. 헤더 행
  let headerRow = worksheet.getRow(6)
  headerRow.getCell(1).value = '사번'
  headerRow.getCell(2).value = '이름'
  headerRow.getCell(3).value = '발생'
  headerRow.getCell(4).value = ''
  
  // 날짜 헤더 (1~31일)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(parseInt(year), parseInt(month) - 1, day)
    const dayOfWeek = date.getDay()
    const dayName = dayNames[dayOfWeek]
    
    const cell = headerRow.getCell(4 + day)
    cell.value = `${day}(${dayName})`
    
    // 토요일 파란색, 일요일 빨간색
    if (dayOfWeek === 6) { // 토요일
      cell.font = { color: { argb: 'FF0000FF' }, bold: true }
    } else if (dayOfWeek === 0) { // 일요일
      cell.font = { color: { argb: 'FFFF0000' }, bold: true }
    }
  }
  
  headerRow.getCell(36).value = '사용'
  headerRow.getCell(39).value = '잔여'
  headerRow.getCell(41).value = '비고란'
  
  // 7. 범례 행
  let legendRow = worksheet.getRow(7)
  legendRow.getCell(3).value = 'Y'
  legendRow.getCell(4).value = 'H'
  legendRow.getCell(33).value = 'Y'
  legendRow.getCell(34).value = 'Y/2'
  legendRow.getCell(35).value = 'H'
  legendRow.getCell(36).value = 'Y'
  legendRow.getCell(37).value = 'H'
  
  // 직원별 데이터 그룹화
  const employeeData: { [employeeId: string]: { [date: string]: string } } = {}
  
  events.forEach(event => {
    const employee = employeeMap[event.employee_id]
    if (!employee) return
    
    const employeeKey = `${employee.employee_id}_${employee.name}`
    const day = parseInt(event.date.split('-')[2])
    
    if (!employeeData[employeeKey]) {
      employeeData[employeeKey] = {}
    }
    
    let value = ''
    switch (event.type) {
      case 'annual_leave':
        value = 'Y'
        break
      case 'half_day':
        value = 'Y/2'
        break
      case 'quarter_day':
        value = '1/4'
        break
    }
    
    if (employeeData[employeeKey][day]) {
      employeeData[employeeKey][day] += ',' + value
    } else {
      employeeData[employeeKey][day] = value
    }
  })
  
  // 8. 직원별 데이터 행
  employeeList.forEach((emp, empIndex) => {
    const rowIndex = 8 + empIndex
    const row = worksheet.getRow(rowIndex)
    
    row.getCell(1).value = emp.employee_id
    row.getCell(2).value = emp.name
    row.getCell(3).value = '0'
    row.getCell(4).value = ''
    
    // 1일부터 31일까지
    for (let day = 1; day <= 31; day++) {
      const employeeKey = `${emp.employee_id}_${emp.name}`
      let dayData = employeeData[employeeKey]?.[day]
      
      // 데이터가 없으면 요일 확인해서 일요일은 'off', 나머지는 'D'
      if (!dayData) {
        const date = new Date(parseInt(year), parseInt(month) - 1, day)
        const dayOfWeek = date.getDay()
        dayData = dayOfWeek === 0 ? 'off' : 'D'
      }
      
      const cell = row.getCell(4 + day)
      cell.value = dayData
      
      // 주말 색상 적용
      const date = new Date(parseInt(year), parseInt(month) - 1, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 6) { // 토요일
        cell.font = { color: { argb: 'FF0000FF' } }
      } else if (dayOfWeek === 0) { // 일요일
        cell.font = { color: { argb: 'FFFF0000' } }
      }
    }
    
    // 사용, 잔여, 비고 컬럼
    row.getCell(36).value = '0'
    row.getCell(37).value = '0'
    row.getCell(38).value = '0'
    row.getCell(40).value = '0'
  })
}