'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore, PostWithAuthor } from '@/store/posts'
import { useConfirmationsStore } from '@/store/confirmations'
import { useNotificationsStore } from '@/store/notifications'
import { postApi } from '@/lib/supabase/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function DepartmentPostsPage() {
  const { employee, setUser, setEmployee } = useAuthStore()
  const { posts: allPosts, initializePosts } = usePostsStore()
  const { isConfirmedByEmployee, getConfirmationStats } = useConfirmationsStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [departmentName, setDepartmentName] = useState<string>('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      if (!employee?.department_id) {
        setIsLoading(false)
        return
      }

      try {
        // 스토어 초기화 (첫 방문시에만)
        if (allPosts.length === 0) {
          initializePosts()
        }
        // 부서별 공지만 필터링
        const departmentPosts = allPosts.filter(post => 
          post.post_type === 'department' && 
          post.department_id === employee.department_id
        )

        // 고정글을 먼저, 그 다음 긴급글, 마지막으로 일반글 순서로 정렬
        const sortedPosts = departmentPosts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          if (a.is_urgent && !b.is_urgent) return -1
          if (!a.is_urgent && b.is_urgent) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        setFilteredPosts(sortedPosts)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [employee, allPosts, initializePosts])

  useEffect(() => {
    if (!employee?.department_id) return
    
    const departmentPosts = allPosts.filter(post => 
      post.post_type === 'department' && 
      post.department_id === employee.department_id
    )
    
    if (searchTerm) {
      const filtered = departmentPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPosts(filtered)
    } else {
      // 정렬 적용
      const sortedPosts = departmentPosts.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        if (a.is_urgent && !b.is_urgent) return -1
        if (!a.is_urgent && b.is_urgent) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setFilteredPosts(sortedPosts)
    }
  }, [searchTerm, allPosts, employee])

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

  const getPostIcon = (post: Post) => {
    if (post.is_pinned) return '📌'
    if (post.is_urgent) return '🚨'
    return '📋'
  }

  const getPostPrefix = (post: Post) => {
    if (post.is_pinned) return '[고정]'
    if (post.is_urgent) return '[긴급]'
    return ''
  }

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case '의료진': return '🏥'
      case '약제팀': return '💊'
      case '행정팀': return '📋'
      default: return '🏢'
    }
  }

  // 삭제 권한 확인 함수
  const canDeletePost = (post: Post) => {
    if (!employee) return false
    
    // 시스템관리자 사번 9999는 모든 공지 삭제 가능
    if (employee.employee_id === '9999') return true
    
    // 작성자 본인이거나 관리자인 경우
    return post.author_id === employee.id || 
           employee.role === 'SUPER_ADMIN' || 
           employee.role === 'DEPARTMENT_ADMIN'
  }

  // 삭제 모달 열기
  const openDeleteModal = (post: Post) => {
    setPostToDelete(post)
    setDeleteModalOpen(true)
  }

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setPostToDelete(null)
    setIsDeleting(false)
  }

  // 게시글 삭제 실행
  const handleDeletePost = async () => {
    if (!postToDelete) return

    setIsDeleting(true)
    try {
      await postApi.deletePost(postToDelete.id)
      
      // 성공시 목록에서 제거
      setFilteredPosts(prev => prev.filter(post => post.id !== postToDelete.id))
      
      alert('게시글이 성공적으로 삭제되었습니다.')
      closeDeleteModal()
      
      // 전체 포스트 목록 새로고침
      initializePosts()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!employee?.department_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <div className="text-lg text-gray-600">부서 정보가 없습니다.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl mr-2">🏥</Link>
              <h1 className="text-xl font-semibold text-gray-900">
                병원 직원 게시판
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{employee?.name}</span>
                {departmentName && (
                  <span className="ml-2 text-gray-500">| {departmentName}</span>
                )}
              </div>
              <Link href="/notifications" className="relative p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => {
                  setUser(null)
                  setEmployee(null)
                  router.push('/login')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row">
          <Sidebar currentPath="/posts/department" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2 sm:mr-3 text-lg sm:text-xl">{getDepartmentIcon(employee.department_id)}</span>
                  <span className="break-words">
                    {departmentName || '부서'} 공지
                  </span>
                </h2>
                <Link
                  href="/posts/create"
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>✏️</span>
                  <span>새 공지 작성</span>
                </Link>
              </div>

              {/* Department Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getDepartmentIcon(employee.department_id)}</span>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {departmentName || '부서'} 전용 공지사항
                    </h3>
                    <p className="text-sm text-blue-700">
                      {departmentName || '해당 부서'} 소속 직원들만 볼 수 있는 공지사항입니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="제목, 내용, 작성자로 검색..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    필터
                  </button>
                </div>
              </div>

              {/* Posts List */}
              <div className="bg-white rounded-lg shadow">
                {filteredPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? '검색 결과가 없습니다.' : '부서 공지사항이 없습니다.'}
                    </h3>
                    <p className="text-sm">
                      {searchTerm 
                        ? '다른 검색어로 시도해보세요.' 
                        : `${departmentName || '해당 부서'}에 게시된 공지사항이 아직 없습니다.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredPosts.map((post) => (
                      <div key={post.id} className="hover:bg-gray-50 transition-colors">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <Link href={`/posts/${post.id}`} className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-xl">{getPostIcon(post)}</span>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {getPostPrefix(post) && (
                                    <span className={`mr-2 ${post.is_urgent ? 'text-red-600' : 'text-blue-600'}`}>
                                      {getPostPrefix(post)}
                                    </span>
                                  )}
                                  {post.title}
                                </h3>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {departmentName || '부서'}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span>{post.author.name}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(post.created_at)}</span>
                                <span>•</span>
                                <span>조회 {post.view_count}</span>
                              </div>
                            </Link>
                            
                            {/* 삭제 버튼 */}
                            {canDeletePost(post) && (
                              <div className="ml-4">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openDeleteModal(post)
                                  }}
                                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                  title="게시글 삭제"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
                    이전
                  </button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded">
                    1
                  </button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
                    2
                  </button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
                    3
                  </button>
                  <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
                    다음
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold text-gray-900">게시글 삭제 확인</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                다음 게시글을 정말 삭제하시겠습니까?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{postToDelete?.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  작성자: {postToDelete?.author?.name}
                </p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                ⚠️ 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

