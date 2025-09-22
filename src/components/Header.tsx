'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNotificationsStore } from '@/store/notifications'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  showAdminMode?: boolean
}

export default function Header({ showAdminMode = false }: HeaderProps) {
  const { employee, setUser, setEmployee, isAdminMode, setAdminMode } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
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

  // 알림 데이터 가져오기
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id])

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
            <Link href="/dashboard" className="flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 mr-2">
              {showAdminMode && isAdminMode ? (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </Link>
            <h1 className={`text-xl font-semibold ${
              showAdminMode && isAdminMode ? 'text-white' : 'text-gray-900'
            }`}>
              {showAdminMode && isAdminMode ? '관리자 패널' : '병원 직원 게시판'}
            </h1>
            {showAdminMode && isAdminMode && (
              <span className="bg-red-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center shadow-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                관리자 모드
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
                <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold flex items-center shadow-sm ${
                  employee.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 border border-red-200' :
                  employee.role === 'DEPARTMENT_ADMIN' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  employee.role === 'MODERATOR' ? 'bg-green-100 text-green-800 border border-green-200' :
                  'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {employee.role === 'SUPER_ADMIN' && (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2z" clipRule="evenodd" />
                    </svg>
                  )}
                  {employee.role === 'DEPARTMENT_ADMIN' && (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {employee.role === 'MODERATOR' && (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {employee.role === 'USER' && (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                  {employee.role === 'SUPER_ADMIN' ? '슈퍼관리자' :
                   employee.role === 'DEPARTMENT_ADMIN' ? '부서관리자' :
                   employee.role === 'MODERATOR' ? '게시판관리자' :
                   '일반직원'}
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
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center shadow-sm transition-all duration-200 ${
                  isAdminMode 
                    ? 'bg-red-700 text-white hover:bg-red-800 hover:shadow-md' 
                    : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
                }`}
              >
                {isAdminMode ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    일반 모드
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    관리자 모드
                  </>
                )}
              </button>
            )}

            {/* 알림 */}
            {(!showAdminMode || !isAdminMode) && (
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-yellow-50 transition-colors duration-200">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <button 
              onClick={handleLogout}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                showAdminMode && isAdminMode 
                  ? 'text-red-200 hover:text-white hover:bg-red-800' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
