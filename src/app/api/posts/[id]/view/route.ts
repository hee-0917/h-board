import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 조회수 증가
    const { error } = await supabase.rpc('increment_post_view_count', { 
      post_id_param: parseInt(id) 
    })

    if (error) {
      console.error('조회수 증가 오류:', error)
      return NextResponse.json({ error: '조회수 증가에 실패했습니다.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
