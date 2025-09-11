'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNotificationsStore } from '@/store/notifications'

export default function TestNotificationsPage() {
  const { employee } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const createTestNotification = async () => {
    if (!employee?.id) {
      setResult('❌ 로그인이 필요합니다.')
      return
    }

    setIsLoading(true)
    setResult('⏳ 테스트 알림 생성 중...')

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employee.id })
      })

      const data = await response.json()

      if (response.ok) {
        setResult('✅ 테스트 알림이 성공적으로 생성되었습니다!')
        // 알림 목록 새로고침
        fetchNotifications(employee.id)
      } else {
        setResult(`❌ 오류: ${data.error}`)
        console.error('테스트 알림 생성 실패:', data)
      }
    } catch (error) {
      setResult(`❌ 네트워크 오류: ${error}`)
      console.error('테스트 알림 생성 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkNotifications = async () => {
    if (!employee?.id) return

    setResult('⏳ 알림 상태 확인 중...')
    try {
      fetchNotifications(employee.id)
      setResult(`🔔 현재 미읽음 알림: ${unreadCount}개`)
    } catch (error) {
      setResult(`❌ 알림 확인 오류: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔔 알림 시스템 테스트</h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold">현재 사용자: {employee?.name || '로그인 필요'}</p>
              <p>사번: {employee?.employee_id || 'N/A'}</p>
              <p>미읽음 알림: <span className="font-bold text-red-600">{unreadCount}개</span></p>
            </div>

            <div className="space-y-2">
              <button
                onClick={createTestNotification}
                disabled={isLoading || !employee}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? '생성 중...' : '테스트 알림 생성'}
              </button>

              <button
                onClick={checkNotifications}
                disabled={!employee}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                알림 상태 확인
              </button>
            </div>

            {result && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-mono">{result}</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold mb-2">테스트 방법:</h3>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>로그인 후 이 페이지에서 "테스트 알림 생성" 클릭</li>
                <li>대시보드나 다른 페이지로 이동</li>
                <li>종모양(🔔) 옆에 빨간 숫자가 나타나는지 확인</li>
                <li>알림 페이지(/notifications)에서 알림 내용 확인</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}