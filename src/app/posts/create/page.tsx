'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore } from '@/store/posts'
import { useNotificationsStore } from '@/store/notifications'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AttachmentFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

export default function CreatePostPage() {
  const { employee, setUser, setEmployee } = useAuthStore()
  const { addPost } = usePostsStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    postType: 'ALL' as 'ALL' | 'DEPARTMENT',
    departmentId: employee?.department_id || '',
    isUrgent: false,
    isPinned: false
  })
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [departmentName, setDepartmentName] = useState<string>('')
  const [departmentInfo, setDepartmentInfo] = useState<{
    name: string
    employeeCount: number
  } | null>(null)

  // 부서 정보 가져오기
  useEffect(() => {
    const fetchDepartmentInfo = async () => {
      if (!employee?.department_id) return
      
      try {
        const response = await fetch('/api/departments')
        const departments = await response.json()
        
        const employeesResponse = await fetch('/api/employees')
        const employees = await employeesResponse.json()
        
        const currentDepartment = departments.find((dept: { id: number; name: string }) => dept.id === employee.department_id)
        const departmentEmployees = employees.filter((emp: { department_id: number }) => emp.department_id === employee.department_id)
        
        if (currentDepartment) {
          setDepartmentName(currentDepartment.name)
          setDepartmentInfo({
            name: currentDepartment.name,
            employeeCount: departmentEmployees.length
          })
        }
      } catch (error) {
        console.error('부서 정보 조회 오류:', error)
      }
    }

    fetchDepartmentInfo()
  }, [employee?.department_id])

  // 알림 데이터 로드
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id, fetchNotifications])

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: AttachmentFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`파일 "${file.name}"의 크기가 10MB를 초과합니다.`)
        continue
      }
      
      // 허용된 파일 형식 체크
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'text/']
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type))
      
      if (!isAllowed) {
        setError(`파일 "${file.name}"은 지원되지 않는 형식입니다.`)
        continue
      }
      
      newAttachments.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      })
    }
    
    setAttachments(prev => [...prev, ...newAttachments])
    setError('')
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(file => file.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.startsWith('text/')) return '📄'
    return '📎'
  }

  const canCreatePost = () => {
    // 기본적으로 모든 직원이 게시글 작성 가능
    return true
  }

  const canCreateAllPost = () => {
    // 전체 공지는 SUPER_ADMIN, DEPARTMENT_ADMIN, MODERATOR만 작성 가능
    return employee?.role === 'SUPER_ADMIN' || 
           employee?.role === 'DEPARTMENT_ADMIN' || 
           employee?.role === 'MODERATOR'
  }

  const canCreateDepartmentPost = () => {
    // 부서별 공지는 모든 직원이 작성 가능 (자신의 부서에만)
    return true
  }

  const canPinPost = () => {
    // 고정 게시글은 SUPER_ADMIN과 DEPARTMENT_ADMIN만 설정 가능
    return employee?.role === 'SUPER_ADMIN' || employee?.role === 'DEPARTMENT_ADMIN'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // 유효성 검사
      if (!formData.title.trim()) {
        setError('제목을 입력해주세요.')
        return
      }
      
      if (!formData.content.trim()) {
        setError('내용을 입력해주세요.')
        return
      }
      
      if (formData.postType === 'ALL' && !canCreateAllPost()) {
        setError('전체 공지 작성 권한이 없습니다.')
        return
      }
      
      if (formData.isPinned && !canPinPost()) {
        setError('고정 게시글 설정 권한이 없습니다.')
        return
      }

      // 새 게시글 생성 (Database Insert 형식으로)
      const newPostData = {
        title: formData.title,
        content: formData.content,
        author_id: employee?.id || null,
        post_type: formData.postType === 'ALL' ? 'announcement' as const : 'department' as const,
        department_id: formData.postType === 'DEPARTMENT' ? (employee?.department_id || null) : null,
        is_urgent: formData.isUrgent,
        is_pinned: formData.isPinned,
        attachment_urls: attachments.length > 0 ? attachments.map(file => file.name) : null,
      }

      // 스토어에 게시글 추가 (실제 API 호출)
      const success = await addPost(newPostData)

      if (success) {
        console.log('게시글 저장 성공!')
        // 성공 후 약간의 지연을 두고 리다이렉트 (상태 업데이트 시간 확보)
        setTimeout(() => {
          if (formData.postType === 'ALL') {
            router.push('/posts/all')
          } else {
            router.push('/posts/department')
          }
        }, 1000) // 1초 지연으로 변경 (localStorage 저장 시간 확보)
      } else {
        setError('게시글 저장에 실패했습니다. 다시 시도해주세요.')
      }
      
    } catch (err) {
      setError('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">로그인이 필요합니다.</div>
        </div>
      </div>
    )
  }

  if (!canCreatePost()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <div className="text-lg text-gray-600">게시글 작성 권한이 없습니다.</div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <Link href="/dashboard" className="hover:text-gray-700">대시보드</Link>
            <span>{'>'}</span>
            <span className="text-gray-900">게시글 작성</span>
          </div>
        </nav>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">✏️ 새 공지사항 작성</h2>
            <p className="text-gray-600 mt-2">
              중요한 공지사항을 작성하여 직원들에게 전달하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 게시글 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                게시글 유형 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="postType"
                    value="ALL"
                    checked={formData.postType === 'ALL'}
                    onChange={handleInputChange}
                    disabled={!canCreateAllPost()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">📢</span>
                      <span className="text-sm font-medium text-gray-900">전체 공지</span>
                    </div>
                    <div className="text-xs text-gray-500">모든 직원 대상</div>
                    {!canCreateAllPost() && (
                      <div className="text-xs text-red-500">권한 없음</div>
                    )}
                  </div>
                </label>
                
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="postType"
                    value="DEPARTMENT"
                    checked={formData.postType === 'DEPARTMENT'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🏢</span>
                      <span className="text-sm font-medium text-gray-900">부서별 공지</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {departmentInfo ? `${departmentInfo.employeeCount} 대상` : '로딩 중...'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="공지사항 제목을 입력하세요"
              />
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
                required
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="공지사항 내용을 입력하세요&#10;&#10;예시:&#10;- 일시: 2024년 12월 15일&#10;- 장소: 본관 3층 회의실&#10;- 대상: 전체 직원&#10;- 준비물: 개인 노트북"
              />
            </div>

            {/* 옵션 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                게시글 옵션
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isUrgent"
                    checked={formData.isUrgent}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    🚨 긴급 공지 (우선 표시 및 즉시 알림)
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                    disabled={!canPinPost()}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    📌 고정 게시글 (목록 상단 고정)
                    {!canPinPost() && <span className="text-red-500 ml-2">(관리자만 설정 가능)</span>}
                  </span>
                </label>
              </div>
            </div>

            {/* 첨부파일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                첨부파일
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <span className="text-4xl">📎</span>
                  <div className="mt-2">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        파일을 선택하거나 여기로 드래그하세요
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PDF, DOC, DOCX, XLS, XLSX, 이미지 파일 (최대 10MB)
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
                    />
                  </div>
                </div>
              </div>
              
              {/* 첨부파일 목록 */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    첨부파일 ({attachments.length}개)
                  </div>
                  {attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFileIcon(file.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '작성 중...' : '게시글 작성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
