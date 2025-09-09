export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: number
          employee_id: string
          name: string
          email: string | null
          password_hash: string
          department_id: number | null
          position: string | null
          role: string
          phone: string | null
          hire_date: string | null
          avatar_url: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          name: string
          email?: string | null
          password_hash: string
          department_id?: number | null
          position?: string | null
          role?: string
          phone?: string | null
          hire_date?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          name?: string
          email?: string | null
          password_hash?: string
          department_id?: number | null
          position?: string | null
          role?: string
          phone?: string | null
          hire_date?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          title: string
          content: string
          author_id: number | null
          department_id: number | null
          post_type: string
          is_urgent: boolean
          is_pinned: boolean
          view_count: number
          attachment_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          author_id?: number | null
          department_id?: number | null
          post_type?: string
          is_urgent?: boolean
          is_pinned?: boolean
          view_count?: number
          attachment_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          author_id?: number | null
          department_id?: number | null
          post_type?: string
          is_urgent?: boolean
          is_pinned?: boolean
          view_count?: number
          attachment_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      post_confirmations: {
        Row: {
          id: number
          post_id: number
          employee_id: number
          confirmed_at: string
        }
        Insert: {
          id?: number
          post_id: number
          employee_id: number
          confirmed_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          employee_id?: number
          confirmed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Employee = Database['public']['Tables']['employees']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostConfirmation = Database['public']['Tables']['post_confirmations']['Row']