'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNotificationsStore } from '@/store/notifications'
import { Database } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    name: string
    department: {
      name: string
    } | null
  }
}

export default function DashboardPage() {
  const { 
    employee, 
    setUser, 
    setEmployee, 
    isAdminMode, 
    setAdminMode, 
    isAdmin 
  } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [departmentPosts, setDepartmentPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [departmentName, setDepartmentName] = useState<string>('')

  // 부서 이름 가져오기
  useEffect(() => {
    const fetchDepartmentName = async () => {
      if (!employee?.department_id) return
      
      try {
        const response = await fetch('/api/departments')
        const departments = await response.json()
        const currentDepartment = departments.find((dept: { id: number; name: string }) => dept.id === employee.department_id)
        
        if (currentDepartment) {
          setDepartmentName(currentDepartment.name)
        }
      } catch (error) {
        console.error('부서 정보 조회 오류:', error)
      }
    }

    fetchDepartmentName()
  }, [employee?.department_id])

  // 알림 데이터 로드
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id, fetchNotifications])

  useEffect(() => {
    const fetchPosts = async () => {
      if (!employee) return

      try {
        // 실제 데이터베이스에서 데이터 가져오기
        const response = await fetch('/api/posts')
        if (response.ok) {
          const posts = await response.json()
          
          // 긴급 공지 필터링
          const urgentPosts = posts
            .filter((post: any) => post.is_urgent && (post.post_type === 'announcement' || post.post_type === 'ALL'))
            .slice(0, 3)
            .map((post: any) => ({
              ...post,
              author: {
                name: post.employees?.name || '알 수 없음',
                department: { name: post.employees?.department_id ? '부서' : null }
              }
            }))

          // 전체 공지 필터링 (최신 3개)
          const allPosts = posts
            .filter((post: any) => post.post_type === 'announcement' || post.post_type === 'ALL')
            .slice(0, 3)
            .map((post: any) => ({
              ...post,
              author: {
                name: post.employees?.name || '알 수 없음',
                department: { name: post.employees?.department_id ? '부서' : null }
              }
            }))

          // 부서별 공지 필터링 (해당 부서의 최신 3개)
          const departmentPosts = posts
            .filter((post: any) => 
              (post.post_type === 'department' || post.post_type === 'DEPARTMENT') && 
              post.department_id === employee.department_id
            )
            .slice(0, 3)
            .map((post: any) => ({
              ...post,
              author: {
                name: post.employees?.name || '알 수 없음',
                department: { name: post.employees?.department_id ? '부서' : null }
              }
            }))

          setUrgentPosts(urgentPosts)
          setAllPosts(allPosts)
          setDepartmentPosts(departmentPosts)
        } else {
          console.error('게시글 데이터를 가져올 수 없습니다.')
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [employee])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`shadow ${
        isAdminMode ? 'bg-red-600 text-white' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xl sm:text-2xl mr-1 sm:mr-2">🏥</span>
              <h1 className={`text-lg sm:text-xl font-semibold ${
                isAdminMode ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="hidden sm:inline">병원 직원 게시판</span>
                <span className="sm:hidden">병원 게시판</span>
              </h1>
              {isAdminMode && (
                <span className="bg-red-800 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  <span className="hidden sm:inline">🛡️ 관리자 모드</span>
                  <span className="sm:hidden">🛡️</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 권한 표시 - 모바일에서 간소화 */}
              <div className={`text-xs sm:text-sm ${isAdminMode ? 'text-red-100' : 'text-gray-700'} hidden sm:block`}>
                <span className="font-medium">{employee?.name}</span>
                {departmentName && (
                  <span className={`ml-2 ${isAdminMode ? 'text-red-200' : 'text-gray-500'}`}>
                    | {departmentName}
                  </span>
                )}
                {employee?.role && (
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    employee.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                    employee.role === 'DEPARTMENT_ADMIN' ? 'bg-blue-100 text-blue-800' :
                    employee.role === 'MODERATOR' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.role === 'SUPER_ADMIN' ? '👑 슈퍼관리자' :
                     employee.role === 'DEPARTMENT_ADMIN' ? '🛡️ 부서관리자' :
                     employee.role === 'MODERATOR' ? '📝 게시판관리자' :
                     '👤 일반직원'}
                  </span>
                )}
              </div>

              {/* 모바일용 간소화된 사용자 정보 */}
              <div className={`text-xs sm:hidden ${isAdminMode ? 'text-red-100' : 'text-gray-700'}`}>
                <span className="font-medium">{employee?.name}</span>
              </div>

              {/* 관리자 모드 토글 (관리자만 표시) */}
              {isAdmin() && (
                <button
                  onClick={() => setAdminMode(!isAdminMode)}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isAdminMode 
                      ? 'bg-red-800 text-white hover:bg-red-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">
                    {isAdminMode ? '👤 일반 모드' : '🛡️ 관리자 모드'}
                  </span>
                  <span className="sm:hidden">
                    {isAdminMode ? '👤' : '🛡️'}
                  </span>
                </button>
              )}

              <Link href="/notifications" className="relative p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-xl sm:text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => {
                  setUser(null)
                  setEmployee(null)
                  setAdminMode(false)
                  router.push('/login')
                }}
                className={`text-xs sm:text-sm ${isAdminMode ? 'text-red-200 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar - Imported Component */}
          <Sidebar currentPath="/dashboard" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 대시보드</h2>

              {/* Urgent Posts */}
              {urgentPosts.length > 0 && (
                <section>
                  <h3 className="text-base sm:text-lg font-semibold text-red-600 mb-3 sm:mb-4">⚡ 긴급 공지</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {urgentPosts.map((post) => (
                      <Link key={post.id} href={`/posts/${post.id}`} className="block">
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded hover:bg-red-100 transition-colors cursor-pointer">
                          <div className="flex items-start sm:items-center">
                            <span className="text-base sm:text-lg mr-2 flex-shrink-0">🚨</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-red-800 text-sm sm:text-base break-words">
                                [긴급] {post.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-red-600 mt-1">
                                {post.author.name} • {formatTimeAgo(post.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* All Posts */}
              <section>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📝 최신 전체 공지</h3>
                <div className="bg-white rounded-lg shadow">
                  {allPosts.length === 0 ? (
                    <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                      게시된 전체 공지가 없습니다.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {allPosts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.id}`} className="block">
                          <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-start sm:items-center">
                              <span className="text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0">📋</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base break-words">{post.title}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  {post.author.name} • {formatTimeAgo(post.created_at)} • 조회 {post.view_count}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Department Posts */}
              <section>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🏢 최신 부서별 공지</h3>
                <div className="bg-white rounded-lg shadow">
                  {departmentPosts.length === 0 ? (
                    <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                      게시된 부서별 공지가 없습니다.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {departmentPosts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.id}`} className="block">
                          <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-start sm:items-center">
                              <span className="text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0">💊</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base break-words">{post.title}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  {post.author.name} • {formatTimeAgo(post.created_at)} • 조회 {post.view_count}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
