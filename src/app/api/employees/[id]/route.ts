import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const employeeId = parseInt(id)
    
    const body = await request.json()
    const { is_active, admin_employee_id, admin_role, ...updateData } = body

    // 권한 검증을 위해 현재 직원 정보 조회
    const { data: currentEmployee, error: currentError } = await supabase
      .from('employees')
      .select('id, role, department_id')
      .eq('id', admin_employee_id)
      .single()

    if (currentError || !currentEmployee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 수정할 직원 정보 조회
    const { data: targetEmployee, error: targetError } = await supabase
      .from('employees')
      .select('id, department_id')
      .eq('id', employeeId)
      .single()

    if (targetError || !targetEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // 권한 검증: SUPER_ADMIN이거나 같은 부서의 DEPARTMENT_ADMIN만 수정 가능
    if (currentEmployee.role !== 'SUPER_ADMIN' && 
        (currentEmployee.role !== 'DEPARTMENT_ADMIN' || 
         currentEmployee.department_id !== targetEmployee.department_id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 직원 정보 업데이트
    const { data: updatedEmployee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating employee:', error)
      return NextResponse.json(
        { error: '직원 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const employeeId = parseInt(id)

    // 요청에서 관리자 정보 가져오기
    const { searchParams } = new URL(request.url)
    const adminEmployeeId = searchParams.get('admin_employee_id')

    if (!adminEmployeeId) {
      return NextResponse.json({ error: 'Admin employee ID required' }, { status: 400 })
    }

    // 권한 검증을 위해 현재 직원 정보 조회
    const { data: currentEmployee, error: currentError } = await supabase
      .from('employees')
      .select('id, role, department_id')
      .eq('id', parseInt(adminEmployeeId))
      .single()

    if (currentError || !currentEmployee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 삭제할 직원 정보 조회
    const { data: targetEmployee, error: targetError } = await supabase
      .from('employees')
      .select('id, department_id')
      .eq('id', employeeId)
      .single()

    if (targetError || !targetEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // 권한 검증: SUPER_ADMIN이거나 같은 부서의 DEPARTMENT_ADMIN만 삭제 가능
    if (currentEmployee.role !== 'SUPER_ADMIN' && 
        (currentEmployee.role !== 'DEPARTMENT_ADMIN' || 
         currentEmployee.department_id !== targetEmployee.department_id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 직원 삭제
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)

    if (error) {
      console.error('Error deleting employee:', error)
      return NextResponse.json(
        { error: '직원 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '직원이 성공적으로 삭제되었습니다.' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
