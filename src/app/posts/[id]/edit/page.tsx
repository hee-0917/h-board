'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore } from '@/store/posts'
import { useNotificationsStore } from '@/store/notifications'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Post = {
  id: string | number
  title: string
  content: string
  post_type: 'ALL' | 'DEPARTMENT' | 'announcement' | 'department'
  department_id: string | number | null
  is_urgent: boolean
  is_pinned: boolean
  author_id: string | number
  created_at: string
  updated_at: string
}

type Department = {
  id: number
  name: string
  employee_count: number
}

export default function EditPostPage() {
  const { employee, setUser, setEmployee } = useAuthStore()
  const { updatePost } = usePostsStore()
  const { unreadCount } = useNotificationsStore()
  const params = useParams()
  const router = useRouter()
  
  const [post, setPost] = useState<Post | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'ALL' as 'ALL' | 'DEPARTMENT',
    department_id: '',
    is_urgent: false,
    is_pinned: false
  })

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postId = params.id as string
        
        // 게시글 조회
        const response = await fetch(`/api/posts/${postId}`)
        
        if (response.ok) {
          const postData = await response.json()
          console.log('게시글 조회 성공:', postData)
          
          setPost({
            id: postData.id,
            title: postData.title,
            content: postData.content,
            post_type: postData.post_type,
            department_id: postData.department_id,
            is_urgent: postData.is_urgent || false,
            is_pinned: postData.is_pinned || false,
            author_id: postData.author_id,
            created_at: postData.created_at,
            updated_at: postData.updated_at
          })
          
          // 폼 데이터 설정
          setFormData({
            title: postData.title,
            content: postData.content,
            post_type: postData.post_type === 'announcement' ? 'ALL' : 'DEPARTMENT',
            department_id: postData.department_id || '',
            is_urgent: postData.is_urgent || false,
            is_pinned: postData.is_pinned || false
          })
        } else {
          setError('게시글을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('게시글 조회 오류:', error)
        setError('게시글을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments')
        if (response.ok) {
          const data = await response.json()
          setDepartments(data)
        }
      } catch (error) {
        console.error('부서 정보 조회 오류:', error)
      }
    }

    if (employee) {
      fetchPost()
      fetchDepartments()
    }
  }, [params.id, employee])

  // 수정 권한 확인
  const canEditPost = () => {
    if (!employee || !post) return false
    
    // 시스템관리자 사번 9999는 모든 공지 수정 가능
    if (employee.employee_id === '9999') return true
    
    // 작성자 본인만 수정 가능
    return String(post.author_id) === String(employee.id)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!post) return
    
    // 권한 확인
    if (!canEditPost()) {
      alert('수정 권한이 없습니다.')
      return
    }
    
    // 유효성 검사
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }
    
    if (formData.post_type === 'DEPARTMENT' && !formData.department_id) {
      alert('부서를 선택해주세요.')
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + employee?.id // 간단한 인증 헤더
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          post_type: formData.post_type === 'ALL' ? 'announcement' : 'department',
          department_id: formData.post_type === 'DEPARTMENT' ? formData.department_id : null,
          is_urgent: formData.is_urgent,
          is_pinned: formData.is_pinned,
          employee_id: employee?.employee_id, // 권한 확인용
          role: employee?.role // 권한 확인용
        })
      })
      
      if (response.ok) {
        // 스토어 업데이트
        updatePost({
          id: String(post.id),
          title: formData.title,
          content: formData.content,
          post_type: formData.post_type,
          department_id: formData.post_type === 'DEPARTMENT' ? formData.department_id : null,
          is_urgent: formData.is_urgent,
          is_pinned: formData.is_pinned,
          author: {
            name: employee?.name || '',
            department: {
              name: employee?.department_id || ''
            }
          },
          view_count: 0,
          created_at: post.created_at,
          updated_at: new Date().toISOString(),
          author_id: String(post.author_id)
        })
        
        alert('게시글이 성공적으로 수정되었습니다.')
        router.push(`/posts/${post.id}`)
      } else {
        const errorData = await response.json()
        alert(`수정 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('수정 오류:', error)
      alert('게시글 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <div className="text-lg text-gray-600 mb-4">{error}</div>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!post || !canEditPost()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <div className="text-lg text-gray-600 mb-4">수정 권한이 없습니다.</div>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              돌아가기
            </button>
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
                {employee?.department_id && (
                  <span className="ml-2 text-gray-500">| {employee.department_id}</span>
                )}
              </div>
              <Link href="/notifications" className="relative p-1">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <Link href="/dashboard" className="hover:text-gray-700">대시보드</Link>
            <span>{'>'}</span>
            <Link 
              href={post.post_type === 'ALL' || post.post_type === 'announcement' ? '/posts/all' : '/posts/department'} 
              className="hover:text-gray-700"
            >
              {post.post_type === 'ALL' || post.post_type === 'announcement' ? '전체 공지' : '부서별 공지'}
            </Link>
            <span>{'>'}</span>
            <Link href={`/posts/${post.id}`} className="hover:text-gray-700">게시글</Link>
            <span>{'>'}</span>
            <span className="text-gray-900">수정</span>
          </div>
        </nav>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">게시글 수정</h2>
            <p className="text-gray-600 mt-1">게시글 내용을 수정할 수 있습니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            {/* 공지 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공지 유형 *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="post_type"
                    value="ALL"
                    checked={formData.post_type === 'ALL'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">전체 공지 (모든 직원)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="post_type"
                    value="DEPARTMENT"
                    checked={formData.post_type === 'DEPARTMENT'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">부서별 공지</span>
                </label>
              </div>
            </div>

            {/* 부서 선택 */}
            {formData.post_type === 'DEPARTMENT' && (
              <div>
                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
                  부서 선택 *
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">부서를 선택하세요</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.employee_count}명)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 옵션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                옵션
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_urgent"
                    checked={formData.is_urgent}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-red-600">🚨 긴급 공지</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    checked={formData.is_pinned}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-blue-600">📌 상단 고정</span>
                </label>
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="공지 내용을 입력하세요"
                required
              />
            </div>

            {/* 버튼 */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    수정 중...
                  </>
                ) : (
                  <>
                    <span>✏️</span>
                    <span>수정하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
