'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePostsStore } from '@/store/posts'
import { useConfirmationsStore } from '@/store/confirmations'
import { postApi } from '@/lib/supabase/api'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Post = {
  id: string | number
  title: string
  content: string
  author: {
    name: string
    department: {
      name: string | null
    } | null
  }
  post_type: 'ALL' | 'DEPARTMENT' | 'announcement' | 'department'
  department_id: string | number | null
  is_urgent: boolean
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  author_id: string | number
  attachments?: {
    name: string
    url: string
    size: string
  }[]
}

export default function PostDetailPage() {
  const { employee, setUser, setEmployee } = useAuthStore()
  const { posts: allPosts, incrementViewCount } = usePostsStore()
  const { 
    confirmPost, 
    isPostConfirmedByEmployee, 
    getConfirmationsByPost,
    getConfirmationCount,
    fetchConfirmations
  } = useConfirmationsStore()
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmations, setShowConfirmations] = useState(false)
  const [error, setError] = useState('')
  const [viewCountIncremented, setViewCountIncremented] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postId = params.id as string;
        
        // 조회수 증가 플래그 리셋
        setViewCountIncremented(false);
        
        // 먼저 API에서 게시글 조회
        try {
          const response = await fetch(`/api/posts/${postId}`);
          
          if (response.ok) {
            const postData = await response.json();
            console.log('API에서 게시글 조회 성공:', postData);
            setPost({
              id: postData.id,
              title: postData.title,
              content: postData.content,
              author: {
                name: postData.employees?.name || '알 수 없음',
                department: {
                  name: postData.employees?.department_id ? '부서' : null
                }
              },
              post_type: postData.post_type,
              department_id: postData.department_id,
              is_urgent: postData.is_urgent || false,
              is_pinned: postData.is_pinned || false,
              view_count: postData.view_count || 0,
              created_at: postData.created_at,
              updated_at: postData.updated_at,
              author_id: postData.author_id,
              attachments: postData.attachment_urls ? JSON.parse(postData.attachment_urls) : undefined
            });
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.log('API 조회 실패, 스토어에서 찾기 시도:', apiError);
        }
        
        // API 실패시 스토어에서 게시글 찾기
        const foundPost = allPosts.find(p => String(p.id) === postId);
        
        if (foundPost) {
          setPost(foundPost as unknown as Post);
        } else {
          // Mock 데이터에서 찾기 (호환성을 위해)
          const allMockPosts = [
          // 전체 공지
          {
            id: '1',
            title: '병원 내 마스크 착용 의무화',
            content: `코로나19 재확산에 따라 병원 내 모든 구역에서 마스크 착용이 의무화됩니다.

**적용 일시**: 2024년 12월 1일부터
**적용 구역**: 병원 내 모든 구역 (로비, 병동, 진료실, 카페테리아 포함)
**마스크 종류**: KF94 이상 권장

### 주요 내용
1. **환자와 직접 접촉하는 모든 직원**은 N95 마스크 착용 필수
2. **일반 업무 직원**은 KF94 이상 마스크 착용
3. **방문객**에게도 마스크 착용 안내 철저

### 마스크 지급
- 각 부서별로 충분한 마스크를 비치해두었습니다
- 추가 필요 시 총무팀으로 연락 바랍니다

### 문의사항
총무팀: 내선 1234
감염관리팀: 내선 5678

협조해 주시기 바랍니다.`,
            author: { name: '박관리자', department: { name: '행정팀' } },
            post_type: 'ALL' as const,
            department_id: null,
            is_urgent: false,
            is_pinned: true,
            view_count: 247,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            author_id: 'EMP003',
            attachments: [
              { name: '마스크_착용_가이드라인.pdf', url: '#', size: '1.2MB' },
              { name: '감염예방_수칙.jpg', url: '#', size: '512KB' }
            ]
          },
          {
            id: '2',
            title: '응급실 운영 시간 변경 안내',
            content: `12월 1일부터 응급실 운영 시간이 다음과 같이 변경됩니다.

**변경 전**: 24시간 운영
**변경 후**: 오전 6시 ~ 다음날 오전 2시 (20시간 운영)

### 변경 사유
- 야간 의료진 부족
- 응급실 시설 보수 공사

### 야간 응급 상황 대응
**오전 2시 ~ 오전 6시** 사이 응급 상황 발생 시:
1. 119를 통해 인근 대학병원으로 이송
2. 당직 의사 연락처: 010-1234-5678

### 공지 기간
**시행일**: 2024년 12월 1일 (일)
**예상 기간**: 약 3개월 (시설 보수 완료 시까지)

문의사항은 의료진팀으로 연락 바랍니다.`,
            author: { name: '이간호사', department: { name: '의료진' } },
            post_type: 'ALL' as const,
            department_id: null,
            is_urgent: true,
            is_pinned: false,
            view_count: 156,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            author_id: 'EMP002'
          },
          // 부서별 공지 - 의료진
          {
            id: 'dept-1',
            title: '의료진 회의 일정 변경',
            content: `정기 의료진 회의 일정이 변경되었습니다.

**변경 전**: 12월 10일 (화) 오후 3시
**변경 후**: 12월 15일 (일) 오후 2시

### 회의 안건
1. 새로운 의료장비 도입 관련
2. 병동 운영 시간 조정
3. 겨울철 응급환자 대응 방안
4. 의료진 교육 일정

### 참석 대상
- 모든 의료진 (의사, 간호사)
- 부득이한 사정으로 참석 불가 시 사전 연락 필수

### 장소
**회의실**: 본관 3층 대회의실
**준비물**: 개인 노트북, 필기구

### 연락처
의료진팀장 이간호사: 내선 2345

많은 참석 부탁드립니다.`,
            author: { name: '이간호사', department: { name: '의료진' } },
            post_type: 'DEPARTMENT' as const,
            department_id: '의료진',
            is_urgent: false,
            is_pinned: true,
            view_count: 43,
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            author_id: 'EMP002'
          },
          // 부서별 공지 - 약제팀
          {
            id: 'dept-4',
            title: '신약 입고 현황 공유',
            content: `이번 주 신규 입고된 약품 목록을 공유드립니다.

### 신규 입고 약품
1. **아스피린 100mg** - 1,000정
2. **아목시실린 500mg** - 500정  
3. **이부프로펜 400mg** - 800정
4. **로라제팜 0.5mg** - 200정

### 재고 관리 주의사항
- 냉장보관 약품의 온도 체크 필수 (2-8℃)
- 유효기간 임박 약품 우선 사용
- 재고 부족 시 즉시 약제팀으로 연락

### 특별 관리 약품
**로라제팜**: 향정신성 약물로 별도 보관 필요
- 잠금장치가 있는 약품장에 보관
- 사용량 기록 필수

### 문의사항
약제팀 최약사: 내선 3456
응급 상황: 010-9876-5432

재고 관리에 협조해 주시기 바랍니다.`,
            author: { name: '최약사', department: { name: '약제팀' } },
            post_type: 'DEPARTMENT' as const,
            department_id: '약제팀',
            is_urgent: false,
            is_pinned: true,
            view_count: 35,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            author_id: 'EMP004',
            attachments: [
              { name: '신약_입고_목록.xlsx', url: '#', size: '24KB' }
            ]
          }
        ]

          const foundMockPost = allMockPosts.find(p => p.id === postId);
          
          if (!foundMockPost) {
            setError('게시글을 찾을 수 없습니다.');
            return;
          }

          // 접근 권한 확인
          if (foundMockPost.post_type === 'DEPARTMENT' && String(foundMockPost.department_id) !== String(employee?.department_id)) {
            setError('접근 권한이 없습니다.');
            return;
          }

          // 조회수 증가 (Mock 데이터용)
          foundMockPost.view_count += 1;
          
          setPost(foundMockPost);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (employee) {
      fetchPost();
    }
  }, [params.id, employee, allPosts]);

  // 확인 데이터 초기화
  useEffect(() => {
    fetchConfirmations()
  }, [fetchConfirmations])

  // 조회수 증가 (한 번만 실행)
  useEffect(() => {
    if (post && post.id && !viewCountIncremented) {
      incrementViewCount(Number(post.id));
      setViewCountIncremented(true);
    }
  }, [post?.id, viewCountIncremented, incrementViewCount]);

  // 확인 버튼 클릭 핸들러
  const handleConfirmation = async () => {
    if (employee && post) {
      const success = await confirmPost(Number(post.id), employee.id)
      if (success) {
        console.log('게시글 확인 완료')
      }
    }
  }

  // 확인 상태 및 통계
  const isConfirmed = employee && post ? isPostConfirmedByEmployee(Number(post.id), employee.id) : false
  const confirmations = post ? getConfirmationsByPost(Number(post.id)) : []
  const confirmationStats = {
    totalConfirmed: post ? getConfirmationCount(Number(post.id)) : 0,
    confirmationList: confirmations.map(conf => ({
      employee_id: conf.employee_id.toString(),
      employee_name: conf.employee_name,
      department: 'Unknown', // 부서 정보가 없으므로 임시로
      confirmed_at: conf.confirmed_at
    }))
  }

  // 삭제 권한 확인 함수
  const canDeletePost = () => {
    if (!employee || !post) return false
    
    // 시스템관리자 사번 9999는 모든 공지 삭제 가능
    if (employee.employee_id === '9999') return true
    
    // 작성자 본인이거나 관리자인 경우
    return String(post.author_id) === String(employee.id) || 
           employee.role === 'SUPER_ADMIN' || 
           employee.role === 'DEPARTMENT_ADMIN'
  }

  // 수정 권한 확인 함수
  const canEditPost = () => {
    if (!employee || !post) return false
    
    console.log('🔍 수정 권한 확인:', {
      employee_id: employee.id,
      employee_employee_id: employee.employee_id,
      post_author_id: post.author_id,
      employee_role: employee.role
    })
    
    // 시스템관리자 사번 9999는 모든 공지 수정 가능
    if (employee.employee_id === '9999') return true
    
    // 작성자 본인만 수정 가능 - 타입 안전하게 비교
    const canEdit = String(post.author_id) === String(employee.id)
    console.log('🔍 수정 가능 여부:', canEdit)
    return canEdit
  }

  // 삭제 모달 열기
  const openDeleteModal = () => {
    setDeleteModalOpen(true)
  }

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setIsDeleting(false)
  }

  // 게시글 삭제 실행
  const handleDeletePost = async () => {
    if (!post) return

    setIsDeleting(true)
    try {
      await postApi.deletePost(Number(post.id))
      
      alert('게시글이 성공적으로 삭제되었습니다.')
      
      // 이전 페이지로 이동
      router.back()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const getDepartmentIcon = (department: string | null) => {
    if (!department) return '📢'
    switch (department) {
      case '의료진': return '🏥'
      case '약제팀': return '💊'
      case '행정팀': return '📋'
      default: return '🏢'
    }
  }

  const formatFileSize = (size: string) => {
    return size
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

  if (!post) {
    return null
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
              <button className="relative p-1">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
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
              href={post.post_type === 'announcement' || post.post_type === 'ALL' ? '/posts/all' : '/posts/department'} 
              className="hover:text-gray-700"
            >
              {post.post_type === 'announcement' || post.post_type === 'ALL' ? '전체 공지' : '부서별 공지'}
            </Link>
            <span>{'>'}</span>
            <span className="text-gray-900">게시글</span>
          </div>
        </nav>

        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getPostIcon(post)}</span>
                  {(post.post_type === 'department' || post.post_type === 'DEPARTMENT') && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {post.department_id}
                    </span>
                  )}
                  {post.is_urgent && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      긴급
                    </span>
                  )}
                  {post.is_pinned && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      고정
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {getPostPrefix(post) && (
                    <span className={`mr-2 ${post.is_urgent ? 'text-red-600' : 'text-blue-600'}`}>
                      {getPostPrefix(post)}
                    </span>
                  )}
                  {post.title}
                </h1>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center text-sm text-gray-500 space-x-6">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">{post.author.name}</span>
                <span>•</span>
                <span>{post.author.department?.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>작성: {formatDateTime(post.created_at)}</span>
                {post.updated_at !== post.created_at && (
                  <span>수정: {formatDateTime(post.updated_at)}</span>
                )}
                <span>조회 {post.view_count}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">첨부파일</h3>
                <div className="space-y-2">
                  {post.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                ← 돌아가기
              </button>
              
              <div className="flex items-center space-x-3">
                {/* 확인 버튼 */}
                <button
                  onClick={handleConfirmation}
                  disabled={isConfirmed}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                    isConfirmed
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isConfirmed ? '✓ 확인완료' : '확인하기'}
                </button>

                {/* 확인자 목록 보기 버튼 */}
                <button
                  onClick={() => setShowConfirmations(!showConfirmations)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <span>👥</span>
                  <span>확인자 ({confirmationStats.totalConfirmed}명)</span>
                </button>

                {/* 수정 버튼 */}
                {canEditPost() && (
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
                    title="게시글 수정"
                  >
                    <span>✏️</span>
                    <span>수정</span>
                  </Link>
                )}

                {/* 삭제 버튼 */}
                {canDeletePost() && (
                  <button
                    onClick={openDeleteModal}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
                    title="게시글 삭제"
                  >
                    <span>🗑️</span>
                    <span>삭제</span>
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* 확인자 목록 */}
        {showConfirmations && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                확인자 목록 ({confirmationStats.totalConfirmed}명)
              </h3>
              <button
                onClick={() => setShowConfirmations(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {confirmationStats.confirmationList.length > 0 ? (
              <div className="space-y-3">
                {confirmationStats.confirmationList.map((confirmation, index) => (
                  <div 
                    key={`${confirmation.employee_id}-${confirmation.confirmed_at}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {confirmation.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {confirmation.department} | {confirmation.employee_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(confirmation.confirmed_at).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📝</span>
                <p>아직 확인한 직원이 없습니다.</p>
                <p className="text-sm mt-1">첫 번째로 확인해보세요!</p>
              </div>
            )}
          </div>
        )}

        {/* Related Posts */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">관련 공지사항</h3>
          <div className="space-y-3">
            <Link href="/posts/1" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">병원 정보시스템 점검 안내</div>
                  <div className="text-sm text-gray-500">박관리자 • 3일 전</div>
                </div>
              </div>
            </Link>
            <Link href="/posts/2" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">12월 급여 지급 일정 안내</div>
                  <div className="text-sm text-gray-500">박관리자 • 4일 전</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold text-gray-900">게시글 삭제 확인</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                다음 게시글을 정말 삭제하시겠습니까?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{post?.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  작성자: {post?.author?.name}
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
