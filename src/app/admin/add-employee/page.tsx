'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNotificationsStore } from '@/store/notifications'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Department {
  id: number
  name: string
}

export default function AddEmployeePage() {
  const { employee } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationsStore()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    department_id: '',
    role: 'USER' as 'USER' | 'MODERATOR' | 'DEPARTMENT_ADMIN' | 'SUPER_ADMIN',
    email: '',
    position: '직원',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0], // 오늘 날짜
    password: '1234' // 기본 비밀번호
  })

  // 부서 목록 가져오기
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments')
        const data = await response.json()
        
        if (Array.isArray(data)) {
          // 부서 관리자는 본인 부서만 선택 가능
          if (employee?.role === 'DEPARTMENT_ADMIN' && employee.department_id) {
            const filteredDepartments = data.filter(dept => dept.id === employee.department_id)
            setDepartments(filteredDepartments)
            // 기본값으로 본인 부서 설정
            setFormData(prev => ({ ...prev, department_id: employee.department_id?.toString() || '' }))
          } else {
            setDepartments(data)
          }
        }
      } catch (error) {
        console.error('부서 조회 오류:', error)
        setError('부서 정보를 불러올 수 없습니다.')
      }
    }

    fetchDepartments()
  }, [employee])

  // 알림 데이터 로드
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id])

  // 이메일 자동 생성
  useEffect(() => {
    if (formData.employee_id) {
      setFormData(prev => ({
        ...prev,
        email: `${formData.employee_id}@hospital.com`
      }))
    }
  }, [formData.employee_id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.employee_id.trim()) {
      setError('사번을 입력해주세요.')
      return false
    }
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return false
    }
    if (!formData.department_id) {
      setError('부서를 선택해주세요.')
      return false
    }
    if (!formData.role) {
      setError('권한을 선택해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: formData.employee_id,
          name: formData.name,
          email: formData.email,
          department_id: parseInt(formData.department_id),
          role: formData.role,
          position: formData.position,
          phone: formData.phone,
          hire_date: formData.hire_date,
          password_hash: formData.password,
          is_active: true
        })
      })

      if (response.ok) {
        setSuccess(`직원 ${formData.name}(${formData.employee_id})이 성공적으로 등록되었습니다.`)
        
        // 폼 초기화
        setFormData({
          employee_id: '',
          name: '',
          department_id: '',
          role: 'USER',
          email: '',
          position: '직원',
          phone: '',
          hire_date: new Date().toISOString().split('T')[0],
          password: '1234'
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || '직원 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('직원 등록 오류:', error)
      setError('서버 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 관리자 권한 체크
  if (!employee || (employee.role !== 'SUPER_ADMIN' && employee.role !== 'DEPARTMENT_ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                <span className="hidden sm:inline">🏥 병원 직원 게시판 - 관리자</span>
                <span className="sm:hidden">🏥 관리자</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">{employee.name}</span>
              <span className="text-xs sm:hidden text-gray-700">{employee.name}</span>
              <Link href="/notifications" className="relative p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-xl sm:text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
              >
                대시보드
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Sidebar */}
          <Sidebar currentPath="/admin/add-employee" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">👤 개별 직원 추가</h2>
                <p className="text-gray-600 mt-1">새로운 직원을 개별적으로 등록합니다.</p>
              </div>

              {/* Form */}
              <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 사번 */}
                      <div>
                        <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-2">
                          사번 *
                        </label>
                        <input
                          type="text"
                          id="employee_id"
                          name="employee_id"
                          value={formData.employee_id}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 9999"
                        />
                      </div>

                      {/* 이름 */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          이름 *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 홍길동"
                        />
                      </div>

                      {/* 부서 */}
                      <div>
                        <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
                          부서 *
                          {employee?.role === 'DEPARTMENT_ADMIN' && (
                            <span className="text-xs text-gray-500 ml-2">(본인 부서만 선택 가능)</span>
                          )}
                        </label>
                        <select
                          id="department_id"
                          name="department_id"
                          value={formData.department_id}
                          onChange={handleInputChange}
                          required
                          disabled={employee?.role === 'DEPARTMENT_ADMIN'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            employee?.role === 'DEPARTMENT_ADMIN' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">부서를 선택하세요</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 권한 */}
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                          권한 레벨 *
                          {employee?.role === 'DEPARTMENT_ADMIN' && (
                            <span className="text-xs text-gray-500 ml-2">(일반 직원만 추가 가능)</span>
                          )}
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                          disabled={employee?.role === 'DEPARTMENT_ADMIN'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            employee?.role === 'DEPARTMENT_ADMIN' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="USER">👤 일반 직원</option>
                          {employee?.role === 'SUPER_ADMIN' && (
                            <>
                              <option value="MODERATOR">📝 게시판 관리자</option>
                              <option value="DEPARTMENT_ADMIN">🛡️ 부서 관리자</option>
                              <option value="SUPER_ADMIN">👑 슈퍼 관리자</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 추가 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 이메일 (자동 생성) */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          이메일 (자동 생성)
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="사번 입력 시 자동 생성"
                          readOnly
                        />
                      </div>

                      {/* 직책 */}
                      <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                          직책
                        </label>
                        <input
                          type="text"
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 간호사, 의사, 행정직 등"
                        />
                      </div>

                      {/* 전화번호 */}
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          전화번호
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 010-1234-5678"
                        />
                      </div>

                      {/* 입사일 */}
                      <div>
                        <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-2">
                          입사일
                        </label>
                        <input
                          type="date"
                          id="hire_date"
                          name="hire_date"
                          value={formData.hire_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 비밀번호 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">로그인 정보</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-blue-600 mr-3">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">기본 로그인 정보</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            • 로그인 ID: 사번<br />
                            • 초기 비밀번호: 1234<br />
                            • 이메일: {formData.employee_id ? `${formData.employee_id}@hospital.com` : '사번@hospital.com'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 에러/성공 메시지 */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {success}
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push('/admin/employee-list')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          등록 중...
                        </>
                      ) : (
                        '직원 등록'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
