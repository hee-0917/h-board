import { create } from 'zustand'
import { UserRole, RoleChecker } from '@/types/roles'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { employeeApi } from '@/lib/supabase/api'

type Employee = Database['public']['Tables']['employees']['Row']

interface AuthState {
  user: User | null
  employee: Employee | null
  isLoading: boolean
  isAdminMode: boolean
  setUser: (user: User | null) => void
  setEmployee: (employee: Employee | null) => void
  setLoading: (loading: boolean) => void
  setAdminMode: (isAdmin: boolean) => void
  login: (employee_id: string, password: string) => Promise<boolean>
  logout: () => void
  // 권한 체크 헬퍼 함수들
  hasRole: (role: UserRole) => boolean
  hasMinimumRole: (requiredRole: UserRole) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isDepartmentAdmin: () => boolean
  canManagePosts: () => boolean
  canManageEmployees: () => boolean
  canManageSystem: () => boolean
  canAccessPage: (path: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  employee: null,
  isLoading: true,
  isAdminMode: false,
  setUser: (user) => set({ user }),
  setEmployee: (employee) => set({ employee }),
  setLoading: (isLoading) => set({ isLoading }),
  setAdminMode: (isAdminMode) => set({ isAdminMode }),
  
  login: async (employee_id: string, password: string) => {
    set({ isLoading: true })
    try {
      // API 엔드포인트를 통한 로그인
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        set({
          employee: data.employee,
          user: null, // Supabase Auth 사용하지 않으므로 null
          isLoading: false
        })
        return true
      } else {
        console.error('로그인 실패:', data.error)
        set({ isLoading: false })
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      set({ isLoading: false })
      return false
    }
  },

  logout: () => set({ user: null, employee: null, isAdminMode: false }),
  
  // 권한 체크 헬퍼 함수들
  hasRole: (role: UserRole) => {
    const { employee } = get()
    return employee?.role === role
  },
  
  hasMinimumRole: (requiredRole: UserRole) => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.hasMinimumRole(employee.role as UserRole, requiredRole)
  },
  
  isAdmin: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.isAdmin(employee.role as UserRole)
  },
  
  isSuperAdmin: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.isSuperAdmin(employee.role as UserRole)
  },
  
  isDepartmentAdmin: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.isDepartmentAdmin(employee.role as UserRole)
  },
  
  canManagePosts: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.canManagePosts(employee.role as UserRole)
  },
  
  canManageEmployees: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.canManageEmployees(employee.role as UserRole)
  },
  
  canManageSystem: () => {
    const { employee } = get()
    if (!employee?.role) return false
    return RoleChecker.canManageSystem(employee.role as UserRole)
  },
  
  canAccessPage: (path: string) => {
    const { employee } = get()
    if (!employee?.role) return false
    
    // 페이지 권한 체크 로직
    const userRole = employee.role as UserRole
    
    // 관리자 페이지가 아니면 모든 권한 허용
    if (!path.startsWith('/admin')) {
      return true
    }
    
    // 관리자 페이지는 최소 부서관리자 이상
    return RoleChecker.hasMinimumRole(userRole, UserRole.DEPARTMENT_ADMIN)
  }
}))
