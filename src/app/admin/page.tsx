'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore } from '@/store/posts'
import { useConfirmationsStore } from '@/store/confirmations'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminOnly } from '@/components/auth/RoleGuard'
import Link from 'next/link'

interface DashboardStats {
  totalEmployees: number
  totalPosts: number
  urgentPosts: number
  todayPosts: number
  confirmationRate: number
  activeEmployees: number
  departmentStats: {
    name: string
    employeeCount: number
    confirmationRate: number
  }[]
  recentActivities: {
    id: string
    type: 'post' | 'confirmation' | 'login'
    message: string
    time: string
    user: string
  }[]
}

export default function AdminDashboard() {
  const { employee } = useAuthStore()
  const { posts, initializePosts } = usePostsStore()
  const { confirmations } = useConfirmationsStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 스토어 초기화
    if (posts.length === 0) {
      initializePosts()
    }

    // 통계 계산
    const calculateStats = () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Mock 직원 데이터
      const mockEmployees = [
        { name: '김의사', department: '의료진', lastLogin: new Date() },
        { name: '이간호사팀장', department: '의료진', lastLogin: new Date() },
        { name: '박관리자', department: '행정팀', lastLogin: new Date() },
        { name: '최약사', department: '약제팀', lastLogin: new Date() },
        { name: '정홍보팀', department: '홍보팀', lastLogin: new Date() },
        { name: '김간호사', department: '의료진', lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { name: '이약사', department: '약제팀', lastLogin: new Date() },
        { name: '박행정', department: '행정팀', lastLogin: new Date() },
      ]

      const todayPosts = posts.filter(post => 
        new Date(post.created_at) >= today
      ).length

      const urgentPosts = posts.filter(post => post.is_urgent).length

      const totalConfirmations = confirmations.length
      const totalPossibleConfirmations = posts.length * mockEmployees.length
      const confirmationRate = totalPossibleConfirmations > 0 
        ? (totalConfirmations / totalPossibleConfirmations) * 100 
        : 0

      const activeEmployees = mockEmployees.filter(emp => 
        new Date(emp.lastLogin) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length

      // 부서별 통계
      const departments = ['의료진', '행정팀', '약제팀', '홍보팀']
      const departmentStats = departments.map(dept => {
        const deptEmployees = mockEmployees.filter(emp => emp.department === dept)
        const deptConfirmations = confirmations.filter(conf => 
          deptEmployees.some(emp => emp.name === conf.employee_name)
        )
        const deptRate = deptEmployees.length > 0 
          ? (deptConfirmations.length / (posts.length * deptEmployees.length)) * 100 
          : 0

        return {
          name: dept,
          employeeCount: deptEmployees.length,
          confirmationRate: Math.round(deptRate)
        }
      })

      // 최근 활동
      const recentActivities = [
        {
          id: '1',
          type: 'post' as const,
          message: '새로운 긴급 공지가 작성되었습니다',
          time: '2분 전',
          user: '박관리자'
        },
        {
          id: '2',
          type: 'confirmation' as const,
          message: '마스크 착용 의무화 공지를 확인했습니다',
          time: '5분 전',
          user: '김의사'
        },
        {
          id: '3',
          type: 'login' as const,
          message: '시스템에 로그인했습니다',
          time: '10분 전',
          user: '이간호사팀장'
        },
        {
          id: '4',
          type: 'confirmation' as const,
          message: '응급실 운영시간 변경 공지를 확인했습니다',
          time: '15분 전',
          user: '최약사'
        }
      ]

      return {
        totalEmployees: mockEmployees.length,
        totalPosts: posts.length,
        urgentPosts,
        todayPosts,
        confirmationRate: Math.round(confirmationRate),
        activeEmployees,
        departmentStats,
        recentActivities
      }
    }

    const newStats = calculateStats()
    setStats(newStats)
    setIsLoading(false)
  }, [posts, confirmations, initializePosts])

  if (isLoading || !stats) {
    return (
      <AdminOnly>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminOnly>
    )
  }

  return (
    <AdminOnly>
      <AdminLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
            <p className="text-gray-600">
              {employee?.role === 'SUPER_ADMIN' ? '전체 시스템' : `${employee?.department_id} 부서`} 현황을 한눈에 확인하세요
            </p>
          </div>

          {/* 주요 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 직원 수</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}명</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 게시글</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}개</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">긴급 공지</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentPosts}개</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">확인률</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmationRate}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 부서별 현황 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">부서별 현황</h3>
              <div className="space-y-4">
                {stats.departmentStats.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      <p className="text-sm text-gray-500">{dept.employeeCount}명</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{dept.confirmationRate}%</p>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${dept.confirmationRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <span className="text-lg">
                      {activity.type === 'post' ? '📝' : 
                       activity.type === 'confirmation' ? '✅' : '🔑'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 액션</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSuperAdmin() && (
                <Link
                  href="/admin/employees"
                  className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <p className="font-medium text-gray-900">직원 관리</p>
                    <p className="text-sm text-gray-500">직원 추가/수정/삭제</p>
                  </div>
                </Link>
              )}
              
              <Link
                href="/admin/posts"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <span className="text-2xl mr-3">📝</span>
                <div>
                  <p className="font-medium text-gray-900">게시글 관리</p>
                  <p className="text-sm text-gray-500">공지사항 관리</p>
                </div>
              </Link>

              <Link
                href="/admin/analytics"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium text-gray-900">통계 분석</p>
                  <p className="text-sm text-gray-500">상세 통계 확인</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminOnly>
  )
}
