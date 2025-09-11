'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Database } from '@/types/database'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Calendar from '@/components/Calendar'

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    name: string
    department: {
      name: string
    } | null
  }
}

export default function DashboardPage() {
  const { employee } = useAuthStore()
  const [urgentPosts, setUrgentPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [departmentPosts, setDepartmentPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full opacity-3 blur-3xl"></div>
      </div>

      {/* Header */}
      <Header showAdminMode={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar - Imported Component */}
          <Sidebar currentPath="/dashboard" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6 sm:space-y-8">
              {/* Dashboard Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  📊 대시보드
                </h2>
                <p className="text-gray-600 text-lg">
                  병원 운영의 모든 정보를 한눈에 확인하세요
                </p>
              </div>

              {/* Urgent Posts */}
              {urgentPosts.length > 0 && (
                <section>
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-1 shadow-lg">
                    <div className="bg-white rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-2 mr-3">
                          <span className="text-white text-xl">⚡</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">긴급 공지</h3>
                        <div className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          {urgentPosts.length}건
                        </div>
                      </div>
                      <div className="space-y-3">
                        {urgentPosts.map((post) => (
                          <Link key={post.id} href={`/posts/${post.id}`} className="block">
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 p-4 rounded-xl hover:shadow-md hover:from-red-100 hover:to-pink-100 transition-all duration-200 cursor-pointer group">
                              <div className="flex items-start">
                                <div className="bg-red-500 rounded-full p-2 mr-3 group-hover:scale-110 transition-transform">
                                  <span className="text-white text-sm">🚨</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-red-800 text-base mb-1 group-hover:text-red-900 transition-colors">
                                    [긴급] {post.title}
                                  </h4>
                                  <p className="text-sm text-red-600 flex items-center">
                                    <span className="mr-1">👤</span>
                                    {post.author.name}
                                    <span className="mx-2">•</span>
                                    <span className="mr-1">⏰</span>
                                    {formatTimeAgo(post.created_at)}
                                  </p>
                                </div>
                                <div className="text-red-400 group-hover:text-red-600 transition-colors">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Posts Grid - Side by Side */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                {/* All Posts */}
                <section>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-2 mr-3">
                          <span className="text-white text-xl">📝</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">최신 전체 공지</h3>
                      </div>
                      <Link 
                        href="/posts/all" 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center"
                      >
                        <span className="mr-1">👀</span>
                        전체
                      </Link>
                    </div>
                    
                    {allPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-gray-500">게시된 전체 공지가 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-1">새로운 공지사항을 기다려주세요.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allPosts.map((post) => (
                          <Link key={post.id} href={`/posts/${post.id}`} className="block">
                            <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border border-blue-100 p-3 rounded-xl hover:shadow-md hover:from-blue-100/50 hover:to-cyan-100/50 transition-all duration-200 cursor-pointer group">
                              <div className="flex items-start">
                                <div className="bg-blue-500 rounded-full p-1.5 mr-3 group-hover:scale-110 transition-transform">
                                  <span className="text-white text-xs">📋</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-900 transition-colors line-clamp-2">
                                    {post.title}
                                  </h4>
                                  <div className="flex items-center text-xs text-gray-600 space-x-3">
                                    <span className="flex items-center">
                                      <span className="mr-1">👤</span>
                                      {post.author.name}
                                    </span>
                                    <span className="flex items-center">
                                      <span className="mr-1">⏰</span>
                                      {formatTimeAgo(post.created_at)}
                                    </span>
                                    <span className="flex items-center">
                                      <span className="mr-1">👁️</span>
                                      {post.view_count}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-blue-400 group-hover:text-blue-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
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
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2 mr-3">
                          <span className="text-white text-xl">🏢</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">최신 부서별 공지</h3>
                      </div>
                      <Link 
                        href="/posts/department" 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center"
                      >
                        <span className="mr-1">👀</span>
                        전체
                      </Link>
                    </div>
                    
                    {departmentPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">🏢</div>
                        <p className="text-gray-500">게시된 부서별 공지가 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-1">부서에서 새로운 공지사항을 기다려주세요.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {departmentPosts.map((post) => (
                          <Link key={post.id} href={`/posts/${post.id}`} className="block">
                            <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-100 p-3 rounded-xl hover:shadow-md hover:from-purple-100/50 hover:to-pink-100/50 transition-all duration-200 cursor-pointer group">
                              <div className="flex items-start">
                                <div className="bg-purple-500 rounded-full p-1.5 mr-3 group-hover:scale-110 transition-transform">
                                  <span className="text-white text-xs">💼</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-purple-900 transition-colors line-clamp-2">
                                    {post.title}
                                  </h4>
                                  <div className="flex items-center text-xs text-gray-600 space-x-3">
                                    <span className="flex items-center">
                                      <span className="mr-1">👤</span>
                                      {post.author.name}
                                    </span>
                                    <span className="flex items-center">
                                      <span className="mr-1">⏰</span>
                                      {formatTimeAgo(post.created_at)}
                                    </span>
                                    <span className="flex items-center">
                                      <span className="mr-1">👁️</span>
                                      {post.view_count}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-purple-400 group-hover:text-purple-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
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

              {/* Calendar Section */}
              <section>
                <Calendar />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
