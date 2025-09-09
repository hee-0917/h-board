'use client'

import { useAuthStore } from '@/store/auth'
import { UserRole } from '@/types/roles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard',
  fallback = null 
}: RoleGuardProps) {
  const { employee } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // 로그인되지 않은 경우
    if (!employee) {
      router.push('/login')
      return
    }

    // 권한이 없는 경우
    if (!allowedRoles.includes(employee.role as UserRole)) {
      router.push(redirectTo)
      return
    }
  }, [employee, allowedRoles, redirectTo, router])

  // 로딩 중이거나 권한이 없는 경우
  if (!employee || !allowedRoles.includes(employee.role as UserRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 편의 컴포넌트들
export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>{children}</RoleGuard>
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN]}>
      {children}
    </RoleGuard>
  )
}

export function ModeratorAndUp({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.MODERATOR]}>
      {children}
    </RoleGuard>
  )
}
