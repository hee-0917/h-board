import { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']
type Post = Database['public']['Tables']['posts']['Row']
type PostConfirmation = Database['public']['Tables']['post_confirmations']['Row']

export const mockEmployees: Employee[] = [
  { id: 31, employee_id: 'EMP001', name: '김의사', email: 'kim@hospital.com', password_hash: '1234', department_id: 16, position: '주치의', role: 'USER', phone: '010-1234-5678', hire_date: '2023-01-15', avatar_url: null, is_active: true, last_login: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 32, employee_id: 'EMP002', name: '이간호사팀장', email: 'lee@hospital.com', password_hash: '1234', department_id: 16, position: '수간호사', role: 'DEPARTMENT_ADMIN', phone: '010-2345-6789', hire_date: '2022-03-20', avatar_url: null, is_active: true, last_login: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 33, employee_id: 'EMP003', name: '박관리자', email: 'park@hospital.com', password_hash: '1234', department_id: 17, position: '팀장', role: 'SUPER_ADMIN', phone: '010-3456-7890', hire_date: '2020-05-10', avatar_url: null, is_active: true, last_login: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 34, employee_id: 'EMP004', name: '최약사', email: 'choi@hospital.com', password_hash: '1234', department_id: 18, position: '약사', role: 'USER', phone: '010-4567-8901', hire_date: '2023-07-01', avatar_url: null, is_active: true, last_login: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 35, employee_id: 'EMP005', name: '정홍보팀', email: 'jung@hospital.com', password_hash: '1234', department_id: 19, position: '담당자', role: 'MODERATOR', phone: '010-5678-9012', hire_date: '2023-09-15', avatar_url: null, is_active: true, last_login: new Date().toISOString(), created_at: new Date().toISOString() }
]

// 기본 Mock 게시글 데이터
const defaultMockPosts: Post[] = [
  { id: 1, title: '병원 전체 공지 1', content: '모든 직원에게 알립니다. 새로운 정책이 시행됩니다.', author_id: 33, department_id: null, post_type: 'announcement', is_urgent: true, is_pinned: true, view_count: 10, attachment_urls: null, created_at: '2023-10-01T10:00:00Z', updated_at: '2023-10-01T10:00:00Z' },
  { id: 2, title: '간호부 공지사항', content: '간호부 직원들께 필독 사항을 알려드립니다.', author_id: 32, department_id: 16, post_type: 'department', is_urgent: false, is_pinned: false, view_count: 5, attachment_urls: null, created_at: '2023-10-02T11:00:00Z', updated_at: '2023-10-02T11:00:00Z' },
  { id: 3, title: '새로운 의료 장비 도입 안내', content: '최신 의료 장비가 도입되었습니다. 교육 일정을 확인해주세요.', author_id: 33, department_id: null, post_type: 'announcement', is_urgent: false, is_pinned: false, view_count: 8, attachment_urls: null, created_at: '2023-10-03T12:00:00Z', updated_at: '2023-10-03T12:00:00Z' },
  { id: 4, title: '홍보팀 주간 회의록', content: '이번 주 회의 안건과 결과를 공유합니다.', author_id: 35, department_id: 19, post_type: 'department', is_urgent: false, is_pinned: false, view_count: 3, attachment_urls: null, created_at: '2023-10-04T13:00:00Z', updated_at: '2023-10-04T13:00:00Z' },
  { id: 5, title: '응급실 비상 대기표', content: '이번 달 응급실 비상 대기표입니다. 확인 필수!', author_id: 31, department_id: 16, post_type: 'urgent', is_urgent: true, is_pinned: false, view_count: 12, attachment_urls: null, created_at: '2023-10-05T14:00:00Z', updated_at: '2023-10-05T14:00:00Z' },
]

const defaultMockConfirmations: PostConfirmation[] = [
  { id: 1, post_id: 1, employee_id: 31, confirmed_at: '2023-10-01T10:30:00Z' },
  { id: 2, post_id: 1, employee_id: 32, confirmed_at: '2023-10-01T10:35:00Z' },
  { id: 3, post_id: 2, employee_id: 31, confirmed_at: '2023-10-02T11:10:00Z' },
]

// localStorage 키들
const STORAGE_KEYS = {
  POSTS: 'hospital-board-mock-posts',
  CONFIRMATIONS: 'hospital-board-mock-confirmations'
}

// localStorage에서 데이터를 읽어오는 함수
const loadFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error)
    return defaultValue
  }
}

// localStorage에 데이터를 저장하는 함수
const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Mock 데이터 getter (localStorage와 동기화)
export const getMockPosts = (): Post[] => {
  return loadFromStorage(STORAGE_KEYS.POSTS, defaultMockPosts)
}

export const getMockConfirmations = (): PostConfirmation[] => {
  return loadFromStorage(STORAGE_KEYS.CONFIRMATIONS, defaultMockConfirmations)
}

// 전역 Mock 게시글 배열 (localStorage와 동기화됨)
export const mockPosts: Post[] = getMockPosts()
export const mockConfirmations: PostConfirmation[] = getMockConfirmations()

// Mock 데이터 관리 함수들 (localStorage에도 저장)
export const addMockPost = (post: Post): void => {
  const currentPosts = getMockPosts()
  const updatedPosts = [post, ...currentPosts] // 맨 앞에 추가
  saveToStorage(STORAGE_KEYS.POSTS, updatedPosts)
  
  // 메모리 배열도 업데이트
  mockPosts.length = 0
  mockPosts.push(...updatedPosts)
  
  console.log('Mock post added and saved to localStorage:', post)
}

export const addMockConfirmation = (confirmation: PostConfirmation): void => {
  const currentConfirmations = getMockConfirmations()
  const updatedConfirmations = [...currentConfirmations, confirmation]
  saveToStorage(STORAGE_KEYS.CONFIRMATIONS, updatedConfirmations)
  
  // 메모리 배열도 업데이트
  mockConfirmations.length = 0
  mockConfirmations.push(...updatedConfirmations)
  
  console.log('Mock confirmation added and saved to localStorage:', confirmation)
}

export const incrementMockPostViewCount = (postId: number): void => {
  const currentPosts = getMockPosts()
  const updatedPosts = currentPosts.map(post => 
    post.id === postId ? { ...post, view_count: post.view_count + 1 } : post
  )
  saveToStorage(STORAGE_KEYS.POSTS, updatedPosts)
  
  // 메모리 배열도 업데이트
  mockPosts.length = 0
  mockPosts.push(...updatedPosts)
  
  console.log(`Mock post ${postId} view count incremented`)
}

// localStorage 초기화 함수 (개발용)
export const resetMockData = (): void => {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STORAGE_KEYS.POSTS)
  localStorage.removeItem(STORAGE_KEYS.CONFIRMATIONS)
  
  // 메모리 배열도 초기화
  mockPosts.length = 0
  mockPosts.push(...defaultMockPosts)
  
  mockConfirmations.length = 0
  mockConfirmations.push(...defaultMockConfirmations)
  
  console.log('Mock data reset to default values')
}
