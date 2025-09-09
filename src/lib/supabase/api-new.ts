'use client'

import { createClient } from '@/lib/supabase/client'
import { Database, Employee, Post, PostConfirmation } from '@/types/database'
import { 
  mockEmployees, 
  mockPosts, 
  mockConfirmations,
  addMockPost,
  addMockConfirmation,
  incrementMockPostViewCount
} from '@/lib/mock-data'

const supabase = createClient()

export interface PostWithAuthor extends Omit<Post, 'author_id'> {
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
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single()

      if (error) {
        // Mock 로그인 시도
        const mockEmployee = mockEmployees.find(
          emp => emp.employee_id === employee_id && emp.password_hash === password
        )
        return mockEmployee || null
      }

      return data
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
        const postsWithAuthor: PostWithAuthor[] = mockPosts.map(post => {
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

  // 게시글 생성
  async create(post: Database['public']['Tables']['posts']['Insert']): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single()

      if (error) {
        // Mock 게시글 생성
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
        console.log('Mock post created and added:', mockPost)
        return mockPost
      }

      return data
    } catch (error) {
      console.error('Post creation API error:', error)
      return null
    }
  },

  // 조회수 증가
  async incrementViewCount(postId: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_post_view_count', { 
        post_id_param: postId 
      })

      if (error) {
        console.log(`Mock: View count incremented for post ${postId}`)
        incrementMockPostViewCount(postId)
      }
    } catch (error) {
      console.error('Increment view count API error:', error)
      incrementMockPostViewCount(postId)
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
        return mockConfirmations
      }

      return data || []
    } catch (error) {
      console.error('Confirmations API error:', error)
      return mockConfirmations
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
