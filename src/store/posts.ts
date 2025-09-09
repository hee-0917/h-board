import { create } from 'zustand'
import { Post } from '@/types/database'
import { postApi, employeeApi, PostWithAuthor } from '@/lib/supabase/api'

// PostWithAuthor 타입을 export
export type { PostWithAuthor } from '@/lib/supabase/api'

interface PostsState {
  posts: PostWithAuthor[]
  isLoading: boolean
  error: string | null
  fetchPosts: () => Promise<void>
  addPost: (post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'view_count'>) => Promise<boolean>
  updatePost: (post: Post) => void
  incrementViewCount: (postId: number) => Promise<void>
  initializePosts: () => Promise<void>
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    set({ isLoading: true, error: null })
    try {
      const posts = await postApi.getAll()
      set({ posts, isLoading: false })
    } catch (error) {
      console.error('Error fetching posts:', error)
      set({ error: 'Failed to fetch posts', isLoading: false })
    }
  },

  addPost: async (postData) => {
    try {
      const newPost = await postApi.create({
        ...postData,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (newPost) {
        // 작성자 정보 가져오기
        const employees = await employeeApi.getAll()
        const author = employees.find(emp => emp.id === newPost.author_id)
        
        // 로컬 상태에도 즉시 추가 (author 정보 포함)
        const postWithAuthor: PostWithAuthor = {
          ...newPost,
          author: author ? {
            name: author.name,
            department_id: author.department_id
          } : null
        }
        
        // 새 게시글을 목록 맨 앞에 추가
        set(state => ({
          posts: [postWithAuthor, ...state.posts]
        }))
        
        // 즉시 최신 데이터를 다시 가져와서 UI 업데이트 보장
        setTimeout(async () => {
          await get().fetchPosts()
        }, 100)
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating post:', error)
      set({ error: 'Failed to create post' })
      return false
    }
  },

  updatePost: (updatedPost) => {
    set(state => ({
      posts: state.posts.map(post =>
        String(post.id) === String(updatedPost.id)
          ? { ...post, ...updatedPost }
          : post
      )
    }))
  },

  incrementViewCount: async (postId: number) => {
    await postApi.incrementViewCount(postId)
    
    // 로컬 상태도 업데이트
    set(state => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, view_count: post.view_count + 1 }
          : post
      )
    }))
  },

  initializePosts: async () => {
    const { posts } = get()
    if (posts.length === 0) {
      await get().fetchPosts()
    }
  }
}))

// 타입 호환성을 위한 헬퍼 함수들
export const convertToLegacyPost = (post: PostWithAuthor) => ({
  id: post.id.toString(),
  title: post.title,
  content: post.content,
  author: post.author?.name || 'Unknown',
  author_id: post.author_id?.toString() || '',
  department: getDepartmentName(post.department_id),
  department_id: post.department_id?.toString() || '',
  type: post.post_type,
  is_urgent: post.is_urgent,
  is_pinned: post.is_pinned,
  attachments: post.attachment_urls || [],
  view_count: post.view_count,
  created_at: post.created_at,
  updated_at: post.updated_at
})

const getDepartmentName = (departmentId: number | null): string => {
  const departmentMap: Record<number, string> = {
    1: '의료진',
    2: '행정팀', 
    3: '약제팀',
    4: '홍보팀'
  }
  return departmentId ? departmentMap[departmentId] || 'Unknown' : 'All'
}