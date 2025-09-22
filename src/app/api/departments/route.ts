import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .order('id')

    if (error) {
      console.error('Error fetching departments:', error)
      return NextResponse.json({ error: '부서 정보를 가져오는데 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
