import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// 서버 전용 Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock 직원 데이터 (Supabase 연결 실패 시 대체용)
const mockEmployees = [
  {
    id: 1,
    employee_id: 'EMP001',
    password_hash: '1234', // Mock에서는 평문 비교
    name: '김직원',
    department_id: 1,
    role: 'employee',
    is_active: true
  },
  {
    id: 2,
    employee_id: 'EMP002',
    password_hash: '1234',
    name: '이부서장',
    department_id: 1,
    role: 'department_admin',
    is_active: true
  },
  {
    id: 3,
    employee_id: 'EMP003',
    password_hash: '1234',
    name: '박관리자',
    department_id: 2,
    role: 'super_admin',
    is_active: true
  },
  {
    id: 5,
    employee_id: 'EMP005',
    password_hash: '1234',
    name: '최게시판관리자',
    department_id: 1,
    role: 'board_admin',
    is_active: true
  }
]

export async function POST(request: NextRequest) {
  try {
    const { employee_id, password } = await request.json()

    console.log('로그인 시도:', employee_id)

    // 입력 검증
    if (!employee_id || !password) {
      return NextResponse.json(
        { error: '사번과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Supabase에서 직원 정보 조회 시도
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('is_active', true)
        .single()

      if (!error && employee) {
        // bcrypt로 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, employee.password_hash)

        if (isPasswordValid) {
          console.log('Supabase 로그인 성공:', employee_id)
          return NextResponse.json({
            success: true,
            employee: {
              ...employee,
              password_hash: undefined // 비밀번호 해시는 응답에서 제거
            }
          })
        } else {
          console.log('Supabase 비밀번호 불일치:', employee_id)
        }
      } else {
        console.log('Supabase에서 직원 정보 찾을 수 없음:', employee_id)
      }
    } catch (supabaseError) {
      console.log('Supabase 연결 실패, Mock 데이터 사용:', supabaseError)
    }

    // Supabase 실패 시 Mock 데이터로 로그인 시도
    const mockEmployee = mockEmployees.find(
      emp => emp.employee_id === employee_id && emp.is_active
    )

    if (mockEmployee && mockEmployee.password_hash === password) {
      console.log('Mock 로그인 성공:', employee_id)
      return NextResponse.json({
        success: true,
        employee: {
          ...mockEmployee,
          password_hash: undefined // 비밀번호 해시는 응답에서 제거
        }
      })
    }

    // 로그인 실패
    console.log('로그인 실패:', employee_id)
    return NextResponse.json(
      { error: '사번 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )

  } catch (error) {
    console.error('로그인 API 오류:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}