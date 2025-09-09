'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore } from '@/store/posts'
import { useConfirmationsStore } from '@/store/confirmations'
import { useNotificationsStore } from '@/store/notifications'
import { postApi } from '@/lib/supabase/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import Sidebar from '@/components/Sidebar'

type Post = Database['public']['Tables']['posts']['Row']
type Employee = Database['public']['Tables']['employees']['Row']

export type PostWithAuthor = Post & {
  author: { name: string; department_id: number | null } | null
}

export default function AllPostsPage() {
  const { employee, logout } = useAuthStore()
  const { posts: allPosts, fetchPosts, isLoading: postsLoading } = usePostsStore()
  const { confirmations, fetchConfirmations, isPostConfirmedByEmployee } = useConfirmationsStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [departmentName, setDepartmentName] = useState<string>('')

  useEffect(() => {
    // 초기 데이터 로드
    fetchPosts()
    fetchConfirmations()
  }, [fetchPosts, fetchConfirmations])

  // 알림 데이터 로드
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id, fetchNotifications])

  // 부서 이름 가져오기
  useEffect(() => {
    const fetchDepartmentName = async () => {
      if (!employee?.department_id) return
      
      try {
        const response = await fetch('/api/departments')
        const departments = await response.json()
        const currentDepartment = departments.find((dept: any) => dept.id === employee.department_id)
        
        if (currentDepartment) {
          setDepartmentName(currentDepartment.name)
        }
      } catch (error) {
        console.error('부서 정보 조회 오류:', error)
      }
    }

    fetchDepartmentName()
  }, [employee?.department_id])

  useEffect(() => {
    // 전체 공지만 필터링 (announcement 또는 urgent 타입)
    const allPosts_filtered = allPosts.filter(post => 
      post.post_type === 'announcement' || post.post_type === 'urgent'
    )

    let filtered = allPosts_filtered
    
    if (searchTerm) {
      filtered = allPosts_filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.author?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 고정글을 먼저, 그 다음 긴급글, 마지막으로 일반글 순서로 정렬
    const sortedPosts = filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      if (a.is_urgent && !b.is_urgent) return -1
      if (!a.is_urgent && b.is_urgent) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredPosts(sortedPosts)
  }, [allPosts, searchTerm])


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

  const getPostIcon = (post: PostWithAuthor) => {
    if (post.is_pinned) return '📌'
    if (post.is_urgent) return '🚨'
    return '📋'
  }

  const getPostPrefix = (post: PostWithAuthor) => {
    if (post.is_pinned) return '[고정]'
    if (post.is_urgent) return '[긴급]'
    return ''
  }

  // 삭제 권한 확인 함수
  const canDeletePost = (post: PostWithAuthor) => {
    if (!employee) return false
    
    // 시스템관리자 사번 9999는 모든 공지 삭제 가능
    if (employee.employee_id === '9999') return true
    
    // 작성자 본인이거나 관리자인 경우
    return post.author_id === employee.id || 
           employee.role === 'SUPER_ADMIN' || 
           employee.role === 'DEPARTMENT_ADMIN'
  }

  // 삭제 모달 열기
  const openDeleteModal = (post: PostWithAuthor) => {
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
      fetchPosts()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard" className="text-xl sm:text-2xl mr-1 sm:mr-2">🏥</Link>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                <span className="hidden sm:inline">병원 직원 게시판</span>
                <span className="sm:hidden">병원 게시판</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-700 hidden sm:block">
                <span className="font-medium">{employee?.name}</span>
                {departmentName && (
                  <span className="ml-2 text-gray-500">| {departmentName}</span>
                )}
              </div>
              
              {/* 모바일용 간소화된 사용자 정보 */}
              <div className="text-xs sm:hidden text-gray-700">
                <span className="font-medium">{employee?.name}</span>
              </div>

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
                  logout()
                  router.push('/login')
                }}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row">
          <Sidebar currentPath="/posts/all" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📢 전체 공지</h2>
                <Link
                  href="/posts/create"
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>✏️</span>
                  <span>새 공지 작성</span>
                </Link>
              </div>

              {/* Search */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="제목, 내용, 작성자로 검색..."
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap">
                    필터
                  </button>
                </div>
              </div>

              {/* Posts List */}
              <div className="bg-white rounded-lg shadow">
                {filteredPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다.' : '게시된 공지사항이 없습니다.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredPosts.map((post) => {
                      const isConfirmed = employee ? isPostConfirmedByEmployee(post.id, employee.id) : false
                      const confirmedEmployees = confirmations.filter(c => c.post_id === post.id)
                      
                      return (
                        <div key={post.id} className="hover:bg-gray-50 transition-colors">
                          <div className="p-4 sm:p-6">
                            <div className="flex items-start justify-between">
                              <Link href={`/posts/${post.id}`} className="flex-1 min-w-0">
                                <div className="flex items-start sm:items-center space-x-2 mb-2">
                                  <span className="text-lg sm:text-xl flex-shrink-0">{getPostIcon(post)}</span>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">
                                      {getPostPrefix(post) && (
                                        <span className={`mr-2 ${post.is_urgent ? 'text-red-600' : 'text-blue-600'}`}>
                                          {getPostPrefix(post)}
                                        </span>
                                      )}
                                      {post.title}
                                    </h3>
                                    {isConfirmed && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block">
                                        ✓ 확인완료
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2 break-words">
                                  {post.content}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 gap-1 sm:gap-4">
                                  <div className="flex items-center space-x-2 sm:space-x-4">
                                    <span>{post.author?.name || '알 수 없음'}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{formatTimeAgo(post.created_at)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 sm:space-x-4">
                                    <span>조회 {post.view_count}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>👥 {confirmedEmployees.length}명 확인</span>
                                  </div>
                                </div>
                              </Link>
                              
                              {/* 삭제 버튼 */}
                              {canDeletePost(post) && (
                                <div className="ml-2 sm:ml-4 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openDeleteModal(post)
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 sm:p-2 rounded-full hover:bg-red-50 transition-colors"
                                    title="게시글 삭제"
                                  >
                                    <span className="text-sm sm:text-base">🗑️</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
                  작성자: {postToDelete?.author?.name || '알 수 없음'}
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

