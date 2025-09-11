'use client'

import { createClient } from '@/lib/supabase/client'
import { Database, Employee, Post, PostConfirmation } from '@/types/database'
import { 
  mockEmployees, 
  getMockPosts, 
  getMockConfirmations,
  addMockPost,
  addMockConfirmation,
  incrementMockPostViewCount
} from '@/lib/mock-data'
import bcrypt from 'bcryptjs'

const supabase = createClient()

export interface PostWithAuthor extends Post {
  author: {
    name: string
    department_id: number | null
  } | null
}

// 직원 관련 API
export const employeeApi = {
  // 로그인
  async login(employee_id: string, password: string): Promise<Employee | null> {
    try {
      // 먼저 사번으로 직원 정보 조회
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('is_active', true)
        .single()

      if (error || !employee) {
        console.log('직원 정보를 찾을 수 없습니다:', employee_id)
        // Mock 로그인 시도
        const mockEmployee = mockEmployees.find(
          emp => emp.employee_id === employee_id && emp.password_hash === password
        )
        return mockEmployee || null
      }

      // bcrypt로 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, employee.password_hash)
      
      if (isPasswordValid) {
        console.log('로그인 성공:', employee_id)
        return employee
      } else {
        console.log('비밀번호가 일치하지 않습니다:', employee_id)
        return null
      }
    } catch (error) {
      console.error('Login error:', error)
      // Mock 로그인 시도
      const mockEmployee = mockEmployees.find(
        emp => emp.employee_id === employee_id && emp.password_hash === password
      )
      return mockEmployee || null
    }
  },

  // 모든 직원 조회
  async getAll(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return mockEmployees
      }

      return data || []
    } catch (error) {
      console.error('Employees API error:', error)
      return mockEmployees
    }
  },
}

// 게시글 관련 API
export const postApi = {
  // 모든 게시글 조회
  async getAll(): Promise<PostWithAuthor[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          employees (
            name,
            department_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        // Mock 게시글들 (author 정보 포함)
        const postsWithAuthor: PostWithAuthor[] = getMockPosts().map(post => {
          const author = mockEmployees.find(emp => emp.id === post.author_id)
          return {
            ...post,
            author: author ? { name: author.name, department_id: author.department_id } : null
          }
        })
        
        return postsWithAuthor
      }

      // Supabase 데이터를 PostWithAuthor 형식으로 변환
      return (data || []).map(post => ({
        ...post,
        author: post.employees ? { 
          name: post.employees.name, 
          department_id: post.employees.department_id 
        } : null
      }))
    } catch (error) {
      console.error('Posts API error:', error)
      return []
    }
  },

  // 게시글 생성 - 알림 생성을 포함한 /api/posts API 사용
  async create(post: Database['public']['Tables']['posts']['Insert']): Promise<Post | null> {
    console.log('=== 게시글 생성 시작 ===')
    console.log('전송할 데이터:', JSON.stringify(post, null, 2))
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ 게시글 생성 API 실패:', errorData)
        
        // API 실패 시 Mock 데이터 사용
        const mockPost: Post = {
          id: Date.now(), // 임시 ID
          title: post.title,
          content: post.content,
          author_id: post.author_id || null,
          department_id: post.department_id || null,
          post_type: post.post_type || 'announcement',
          is_urgent: post.is_urgent || false,
          is_pinned: post.is_pinned || false,
          view_count: 0,
          attachment_urls: post.attachment_urls || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 전역 Mock 데이터에 추가
        addMockPost(mockPost)
        console.warn('임시로 Mock 데이터에 저장됨:', mockPost)
        return mockPost
      }

      const data = await response.json()
      console.log('✅ 게시글 생성 및 알림 생성 완료!')
      console.log('✅ 저장된 데이터:', JSON.stringify(data.post, null, 2))
      return data.post
    } catch (error) {
      console.error('게시글 생성 오류:', error)
      throw error // 오류를 상위로 전달
    }
  },

  // 조회수 증가
  async incrementViewCount(postId: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_post_view_count', { 
        post_id_param: postId 
      })

      if (error) {
        console.log(`조회수 증가 실패:`, error)
        // 에러가 발생해도 무한 루프를 방지하기 위해 아무것도 하지 않음
      }
    } catch (error) {
      console.error('Increment view count API error:', error)
    }
  },

  // 게시글 삭제
  async deletePost(postId: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시글 삭제에 실패했습니다.')
      }

      return true
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      throw error
    }
  },
}

// 확인 관련 API
export const confirmationApi = {
  // 모든 확인 기록 조회
  async getAll(): Promise<PostConfirmation[]> {
    try {
      const { data, error } = await supabase
        .from('post_confirmations')
        .select('*')

      if (error) {
        return getMockConfirmations()
      }

      return data || []
    } catch (error) {
      console.error('Confirmations API error:', error)
      return getMockConfirmations()
    }
  },

  // 게시글 확인
  async confirm(postId: number, employeeId: number): Promise<PostConfirmation | null> {
    try {
      const { data, error } = await supabase
        .from('post_confirmations')
        .insert({ post_id: postId, employee_id: employeeId })
        .select()
        .single()

      if (error) {
        // Mock 확인 생성
        const newMockConfirmation: PostConfirmation = {
          id: Date.now(),
          post_id: postId,
          employee_id: employeeId,
          confirmed_at: new Date().toISOString(),
        }
        
        addMockConfirmation(newMockConfirmation)
        console.log('Mock confirmation created:', newMockConfirmation)
        return newMockConfirmation
      }
      
      return data
    } catch (error) {
      console.error('Confirmation API error:', error)
      return null
    }
  },
}
