'use client'

import { useAuthStore } from '@/store/auth'
import { UserRole } from '@/types/roles'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { 
    employee, 
    setUser, 
    setEmployee, 
    setAdminMode, 
    isSuperAdmin, 
    isDepartmentAdmin 
  } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    {
      name: '관리자 대시보드',
      href: '/admin',
      icon: '📊',
      roles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN]
    },
    {
      name: '직원 관리',
      href: '/admin/employees',
      icon: '👥',
      roles: [UserRole.SUPER_ADMIN]
    },
    {
      name: '부서 관리',
      href: '/admin/departments',
      icon: '🏢',
      roles: [UserRole.SUPER_ADMIN]
    },
    {
      name: '게시글 관리',
      href: '/admin/posts',
      icon: '📝',
      roles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.MODERATOR]
    },
    {
      name: '통계 분석',
      href: '/admin/analytics',
      icon: '📈',
      roles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN]
    },
    {
      name: '시스템 설정',
      href: '/admin/settings',
      icon: '⚙️',
      roles: [UserRole.SUPER_ADMIN]
    }
  ]

  const canAccess = (roles: UserRole[]) => {
    return employee?.role && roles.includes(employee.role as UserRole)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-semibold">관리자 패널</h1>
              <span className="bg-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {employee?.role === 'SUPER_ADMIN' ? '👑 슈퍼관리자' :
                 employee?.role === 'DEPARTMENT_ADMIN' ? '🛡️ 부서관리자' :
                 '📝 게시판관리자'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-red-100">
                <span className="font-medium">{employee?.name}</span>
                <span className="ml-2 text-red-200">| {employee?.department_id}</span>
              </div>
              
              {/* 일반 모드로 돌아가기 */}
              <button
                onClick={() => {
                  setAdminMode(false)
                  router.push('/dashboard')
                }}
                className="bg-red-800 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
              >
                👤 일반 모드
              </button>

              <button
                onClick={() => {
                  setUser(null)
                  setEmployee(null)
                  setAdminMode(false)
                  router.push('/login')
                }}
                className="text-red-200 hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 mr-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">관리 메뉴</h3>
              <ul className="space-y-2">
                {navigation.map((item) => {
                  if (!canAccess(item.roles)) return null
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center p-3 rounded-lg transition-colors ${
                          pathname === item.href
                            ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* 일반 사용자 메뉴로 돌아가기 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">일반 메뉴</h4>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/dashboard"
                      onClick={() => setAdminMode(false)}
                      className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <span className="mr-3">🏠</span>
                      대시보드
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/posts/all"
                      onClick={() => setAdminMode(false)}
                      className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <span className="mr-3">📢</span>
                      전체 공지
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
