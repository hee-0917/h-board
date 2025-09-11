import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service Key 존재 여부:', !!supabaseServiceKey)

    // 테이블 존재 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('calendar_events')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ 테이블 조회 오류:', tableError)
      return NextResponse.json({
        error: 'Table access failed',
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint
      }, { status: 500 })
    }

    // 간단한 삽입 테스트
    const testData = {
      title: 'DEBUG_TEST',
      type: 'other',
      date: new Date().toISOString().split('T')[0],
      description: 'Debug test event',
      employee_id: 1,
      department_id: 1,
      status: 'approved'
    }

    console.log('📝 테스트 데이터 삽입 시도:', testData)

    const { data: insertData, error: insertError } = await supabase
      .from('calendar_events')
      .insert(testData)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ 테스트 삽입 오류:', insertError)
      return NextResponse.json({
        error: 'Test insert failed',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        testData
      }, { status: 500 })
    }

    // 테스트 데이터 삭제
    await supabase
      .from('calendar_events')
      .delete()
      .eq('title', 'DEBUG_TEST')

    console.log('✅ 디버그 테스트 성공')
    
    return NextResponse.json({
      success: true,
      message: 'Calendar table is working properly',
      testInsertId: insertData?.id
    })

  } catch (error) {
    console.error('🚨 디버그 API 오류:', error)
    return NextResponse.json({
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}