'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'

interface SidebarProps {
  currentPath: string
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const { employee } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isAdmin = employee?.role === 'SUPER_ADMIN' || employee?.role === 'DEPARTMENT_ADMIN'

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        aria-label="메뉴 열기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed lg:static top-0 left-0 h-full w-64 bg-white shadow-lg lg:shadow-none lg:rounded-lg
        transform transition-transform duration-300 ease-in-out z-50
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:mr-8
      `}>
        <div className="p-4 h-full overflow-y-auto">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="메뉴 닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul className="space-y-2">
          <li>
            <Link 
              href="/dashboard" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/dashboard' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🏠</span>
              대시보드
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/all" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/posts/all' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">📢</span>
              전체 공지
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/department" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/posts/department' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🏢</span>
              부서별 공지
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/create" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/posts/create' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">✏️</span>
              게시글 작성
            </Link>
          </li>
          <li>
            <Link 
              href="/search" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/search' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🔍</span>
              검색
            </Link>
          </li>
          <li>
            <Link 
              href="/notifications" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/notifications' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">🔔</span>
              알림
            </Link>
          </li>
          
          {/* 관리자 메뉴 */}
          {isAdmin && (
            <>
              <li className="pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  관리자
                </div>
              </li>
              <li>
                <Link 
                  href="/admin/add-employee" 
                  className={`flex items-center p-2 rounded ${
                    currentPath === '/admin/add-employee' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">👤</span>
                  개별 직원 추가
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/upload-employees" 
                  className={`flex items-center p-2 rounded ${
                    currentPath === '/admin/upload-employees' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">📤</span>
                  직원 명단 업로드
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/employee-list" 
                  className={`flex items-center p-2 rounded ${
                    currentPath === '/admin/employee-list' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">📋</span>
                  직원 목록 관리
                </Link>
              </li>
            </>
          )}
          
          <li>
            <Link 
              href="/settings" 
              className={`flex items-center p-2 rounded ${
                currentPath === '/settings' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">⚙️</span>
              설정
            </Link>
          </li>
          </ul>
        </div>
      </nav>
    </>
  )
}
