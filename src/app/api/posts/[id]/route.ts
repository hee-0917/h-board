import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        employees (
          name,
          department_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('게시글 조회 오류:', error)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 게시글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const updateData = await request.json()

    // 먼저 게시글 정보 조회
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인을 위한 헤더에서 직원 정보 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 간단한 권한 체크 (실제로는 JWT 토큰을 검증해야 함)
    // 여기서는 요청 본문에서 직원 정보를 받아서 처리
    const { employee_id, role } = updateData
    
    // 권한 확인
    const canEdit = 
      employee_id === '9999' || // 시스템관리자
      String(employee_id) === String(post.author_id) // 작성자 본인

    if (!canEdit) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    // 업데이트 데이터에서 권한 관련 필드 제거
    const { employee_id: _, role: __, ...cleanUpdateData } = updateData

    const { data, error } = await supabase
      .from('posts')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('게시글 수정 오류:', error)
      return NextResponse.json({ error: '게시글 수정에 실패했습니다.' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 먼저 게시글 존재 여부 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 연관된 확인 기록 먼저 삭제
    const { error: confirmationError } = await supabase
      .from('post_confirmations')
      .delete()
      .eq('post_id', id)

    if (confirmationError) {
      console.error('확인 기록 삭제 오류:', confirmationError)
    }

    // 게시글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('게시글 삭제 오류:', deleteError)
      return NextResponse.json({ error: '게시글 삭제에 실패했습니다.' }, { status: 400 })
    }

    return NextResponse.json({ message: '게시글이 성공적으로 삭제되었습니다.' })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
