import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    
    console.log('👥 직원 조회 요청:', { department_id })
    
    // 먼저 직원 정보 가져오기 (부서별 필터링 적용)
    let query = supabase
      .from('employees')
      .select('*')
      .order('id')
    
    // 부서별 필터링
    if (department_id) {
      query = query.eq('department_id', department_id)
    }
    
    const { data: employees, error } = await query

    if (error) {
      console.error('Error fetching employees:', error)
      return NextResponse.json({ error: '직원 목록을 가져오는데 실패했습니다.' }, { status: 500 })
    }

    // 부서 정보 가져오기
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')

    if (deptError) {
      console.error('Error fetching departments:', deptError)
      return NextResponse.json({ error: '부서 정보를 가져오는데 실패했습니다.' }, { status: 500 })
    }

    // 부서명을 포함한 형태로 변환
    const formattedEmployees = employees.map(emp => {
      const department = departments?.find(d => d.id === emp.department_id)
      return {
        ...emp,
        department_name: department?.name || '부서 없음'
      }
    })

    console.log('👥 직원 조회 성공, 개수:', formattedEmployees.length)
    return NextResponse.json(formattedEmployees)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const {
      employee_id,
      name,
      email,
      position,
      phone,
      hire_date,
      department_id,
      password_hash,
      role = 'USER'
    } = body

    // 필수 필드 검증
    if (!employee_id || !name || !email) {
      return NextResponse.json(
        { error: '사번, 이름, 이메일은 필수입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmployee) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      )
    }

    // 사번 중복 확인
    const { data: existingEmployeeId } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employee_id)
      .single()

    if (existingEmployeeId) {
      return NextResponse.json(
        { error: '이미 존재하는 사번입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password_hash, 10)

    // 직원 등록
    const { data: newEmployee, error } = await supabase
      .from('employees')
      .insert({
        employee_id,
        name,
        email,
        password_hash: hashedPassword,
        position,
        phone,
        hire_date,
        department_id,
        role,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return NextResponse.json(
        { error: '직원 등록에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(newEmployee, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}