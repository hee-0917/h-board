'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  showAdminMode?: boolean
}

export default function Header({ showAdminMode = false }: HeaderProps) {
  const { employee, setUser, setEmployee, isAdminMode, setAdminMode } = useAuthStore()
  const router = useRouter()
  const [departmentName, setDepartmentName] = useState<string>('')

  // 부서 이름 가져오기
  useEffect(() => {
    const fetchDepartmentName = async () => {
      if (!employee?.department_id) return
      
      try {
        const response = await fetch('/api/departments')
        const departments = await response.json()
        const currentDepartment = departments.find((dept: { id: number; name: string }) => dept.id === employee.department_id)
        
        if (currentDepartment) {
          setDepartmentName(currentDepartment.name)
        }
      } catch (error) {
        console.error('부서 정보 조회 오류:', error)
      }
    }

    fetchDepartmentName()
  }, [employee?.department_id])

  const handleLogout = () => {
    setUser(null)
    setEmployee(null)
    if (showAdminMode) {
      setAdminMode(false)
    }
    router.push('/login')
  }

  return (
    <header className={`shadow ${
      showAdminMode && isAdminMode 
        ? 'bg-red-600 text-white' 
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-2xl mr-2">
              {showAdminMode && isAdminMode ? '🛡️' : '🏥'}
            </Link>
            <h1 className={`text-xl font-semibold ${
              showAdminMode && isAdminMode ? 'text-white' : 'text-gray-900'
            }`}>
              {showAdminMode && isAdminMode ? '관리자 패널' : '병원 직원 게시판'}
            </h1>
            {showAdminMode && isAdminMode && (
              <span className="bg-red-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                🛡️ 관리자 모드
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* 권한 표시 */}
            <div className={`text-sm ${
              showAdminMode && isAdminMode ? 'text-red-100' : 'text-gray-700'
            }`}>
              <span className="font-medium">{employee?.name}</span>
              {departmentName && (
                <span className={`ml-2 ${
                  showAdminMode && isAdminMode ? 'text-red-200' : 'text-gray-500'
                }`}>
                  | {departmentName}
                </span>
              )}
              {employee?.role && (
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  employee.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                  employee.role === 'DEPARTMENT_ADMIN' ? 'bg-blue-100 text-blue-800' :
                  employee.role === 'MODERATOR' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {employee.role === 'SUPER_ADMIN' ? '👑 슈퍼관리자' :
                   employee.role === 'DEPARTMENT_ADMIN' ? '🛡️ 부서관리자' :
                   employee.role === 'MODERATOR' ? '📝 게시판관리자' :
                   '👤 일반직원'}
                </span>
              )}
            </div>

            {/* 관리자 모드 토글 (관리자만 표시) */}
            {showAdminMode && (employee?.role === 'SUPER_ADMIN' || employee?.role === 'DEPARTMENT_ADMIN') && (
              <button
                onClick={() => {
                  if (isAdminMode) {
                    setAdminMode(false)
                    router.push('/dashboard')
                  } else {
                    setAdminMode(true)
                    router.push('/dashboard')
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  isAdminMode 
                    ? 'bg-red-800 text-white hover:bg-red-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isAdminMode ? '👤 일반 모드' : '🛡️ 관리자 모드'}
              </button>
            )}

            {/* 알림 */}
            {!showAdminMode && (
              <button className="relative p-1">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
            )}

            <button 
              onClick={handleLogout}
              className={`hover:${
                showAdminMode && isAdminMode ? 'text-white' : 'text-gray-700'
              } ${
                showAdminMode && isAdminMode ? 'text-red-200' : 'text-gray-500'
              }`}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
