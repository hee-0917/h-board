import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 현재 직원 정보 조회
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json(
        { error: '직원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해시화
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from('employees')
      .update({ 
        password_hash: newPasswordHash
      })
      .eq('id', id)

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '비밀번호가 성공적으로 변경되었습니다.' 
    })

  } catch (error) {
    console.error('비밀번호 변경 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
