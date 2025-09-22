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
        fixed lg:static top-0 left-0 h-full w-64 bg-white shadow-xl lg:shadow-lg lg:rounded-xl border border-sky-200/50
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
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/dashboard' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/dashboard' ? 'text-blue-600' : 'text-blue-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              대시보드
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/all" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/posts/all' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/posts/all' ? 'text-green-600' : 'text-green-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              전체 공지
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/department" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/posts/department' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/posts/department' ? 'text-purple-600' : 'text-purple-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              부서별 공지
            </Link>
          </li>
          <li>
            <Link 
              href="/posts/create" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/posts/create' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/posts/create' ? 'text-orange-600' : 'text-orange-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              게시글 작성
            </Link>
          </li>
          <li>
            <Link 
              href="/search" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/search' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/search' ? 'text-indigo-600' : 'text-indigo-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              검색
            </Link>
          </li>
          <li>
            <Link 
              href="/notifications" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/notifications' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/notifications' ? 'text-yellow-600' : 'text-yellow-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5.405-5.405A2.032 2.032 0 0114 9.5V7a4 4 0 11-8 0v2.5c0 .75-.405 1.405-1.595 2.095L3 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H8" />
              </svg>
              알림
            </Link>
          </li>
          <li>
            <Link 
              href="/calendar" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/calendar' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/calendar' ? 'text-red-600' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              캘린더
            </Link>
          </li>
          <li>
            <Link 
              href="/schedule-management" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/schedule-management' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/schedule-management' ? 'text-teal-600' : 'text-teal-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              일정 관리
            </Link>
          </li>
          
          {/* 관리자 메뉴 */}
          {isAdmin && (
            <>
              <li className="pt-4 border-t border-sky-200">
                <div className="text-xs font-semibold text-sky-500 uppercase tracking-wider mb-3 px-1">
                  관리자
                </div>
              </li>
              <li>
                <Link 
                  href="/admin/add-employee" 
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    currentPath === '/admin/add-employee' 
                      ? 'text-white bg-black shadow-sm border border-gray-800' 
                      : 'text-black hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  개별 직원 추가
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/upload-employees" 
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    currentPath === '/admin/upload-employees' 
                      ? 'text-white bg-black shadow-sm border border-gray-800' 
                      : 'text-black hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  직원 명단 업로드
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/employee-list" 
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    currentPath === '/admin/employee-list' 
                      ? 'text-white bg-black shadow-sm border border-gray-800' 
                      : 'text-black hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  직원 목록 관리
                </Link>
              </li>
            </>
          )}
          
          <li>
            <Link 
              href="/settings" 
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentPath === '/settings' 
                  ? 'text-black bg-gray-100 shadow-sm border border-gray-200' 
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 mr-3 ${
                currentPath === '/settings' ? 'text-gray-600' : 'text-gray-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              설정
            </Link>
          </li>
          </ul>
        </div>
      </nav>
    </>
  )
}
