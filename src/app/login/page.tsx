'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await login(employeeId, password)
      
      if (success) {
        router.push('/dashboard')
      } else {
        setError('사번 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg mb-8">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              병원 직원 게시판
            </span>
          </h1>
          <p className="text-gray-600 text-lg">
            안전하고 효율적인 소통을 위한 공간
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="mr-1">🔒</span>
              보안 로그인
            </span>
            <span className="flex items-center">
              <span className="mr-1">⚡</span>
              빠른 접속
            </span>
            <span className="flex items-center">
              <span className="mr-1">📱</span>
              모바일 지원
            </span>
          </div>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="employee-id" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <span className="mr-2">👤</span>
                    사번
                  </span>
                </label>
                <input
                  id="employee-id"
                  name="employee-id"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="사번을 입력하세요 (예: EMP001)"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <span className="mr-2">🔐</span>
                    비밀번호
                  </span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  로그인
                </span>
              )}
            </button>
          </form>
        </div>

        {/* 테스트 계정 안내 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="text-center mb-4">
            <span className="text-2xl">🧪</span>
            <h3 className="text-lg font-semibold text-gray-900 mt-2">테스트 계정</h3>
            <p className="text-sm text-gray-600">다음 계정으로 시스템을 체험해보세요</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-lg border border-red-100">
              <div className="text-xs font-medium text-red-800 mb-1">👑 슈퍼관리자</div>
              <div className="text-sm font-mono text-gray-700">EMP003 / 1234</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
              <div className="text-xs font-medium text-blue-800 mb-1">🛡️ 부서관리자</div>
              <div className="text-sm font-mono text-gray-700">EMP002 / 1234</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
              <div className="text-xs font-medium text-green-800 mb-1">📝 게시판관리자</div>
              <div className="text-sm font-mono text-gray-700">EMP005 / 1234</div>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs font-medium text-gray-800 mb-1">👤 일반직원</div>
              <div className="text-sm font-mono text-gray-700">EMP001 / 1234</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center text-yellow-800 text-xs">
              <span className="mr-2">💡</span>
              <span><strong>팁:</strong> 각 계정마다 다른 권한과 기능을 확인할 수 있습니다</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}