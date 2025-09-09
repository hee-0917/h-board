import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'all' or 'department'
    const departmentId = searchParams.get('department_id')

    let query = supabase
      .from('posts')
      .select(`
        *,
        employees (
          id,
          name,
          employee_id,
          departments (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (type === 'department' && departmentId) {
      query = query.eq('department_id', departmentId)
    } else if (type === 'all') {
      query = query.is('department_id', null)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('게시글 조회 오류:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, content, department_id, author_id, is_urgent = false } = body

    if (!title || !content || !author_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 게시글 생성
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        department_id: department_id || null,
        author_id,
        is_urgent,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (postError) {
      console.error('게시글 생성 오류:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // 모든 직원에게 알림 생성
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id')

      if (employees && employees.length > 0) {
        const employeeIds = employees.map(emp => emp.id)
        
        // 알림 생성
        const notificationTitle = is_urgent ? '🚨 긴급 공지사항' : '📢 새 공지사항'
        const notificationMessage = department_id 
          ? `새로운 부서 공지사항이 등록되었습니다: ${title}`
          : `새로운 전체 공지사항이 등록되었습니다: ${title}`

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(
            employeeIds.map(employee_id => ({
              title: notificationTitle,
              message: notificationMessage,
              type: is_urgent ? 'urgent' : 'info',
              employee_id,
              post_id: post.id,
              is_read: false
            }))
          )

        if (notificationError) {
          console.error('알림 생성 오류:', notificationError)
          // 알림 생성 실패해도 게시글은 성공으로 처리
        }
      }
    } catch (notificationError) {
      console.error('알림 생성 중 오류:', notificationError)
      // 알림 생성 실패해도 게시글은 성공으로 처리
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('게시글 생성 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
