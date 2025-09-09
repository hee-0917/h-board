'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'

interface Employee {
  id: number
  employee_id: string
  name: string
  email: string
  position: string
  phone: string
  hire_date: string
  department_id: number
  department_name: string
  role: string
  is_active: boolean
  last_login: string | null
}

export default function EmployeeListPage() {
  const { employee } = useAuthStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    let filtered = employees

    // 부서 관리자는 본인 부서 직원만 볼 수 있음
    if (employee.role === 'DEPARTMENT_ADMIN' && employee.department_id) {
      filtered = employees.filter(emp => emp.department_id === employee.department_id)
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEmployees(filtered)
  }, [searchTerm, employees, employee])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        console.error('Failed to fetch employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/employees/${employeeId}?admin_employee_id=${employee.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEmployees(employees.filter(emp => emp.id !== employeeId))
        alert('직원이 삭제되었습니다.')
      } else {
        const errorData = await response.json()
        alert(errorData.error || '직원 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('직원 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (employeeId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          is_active: !currentStatus,
          admin_employee_id: employee.id,
          admin_role: employee.role
        })
      })

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? { ...emp, is_active: !currentStatus } : emp
        ))
        alert(`직원이 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 관리자 권한 확인
  if (!employee || (employee.role !== 'SUPER_ADMIN' && employee.role !== 'DEPARTMENT_ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-lg text-gray-600">접근 권한이 없습니다.</div>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl mr-2">🏥</Link>
              <h1 className="text-xl font-semibold text-gray-900">
                직원 목록 관리
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{employee?.name}</span>
                <span className="ml-2 text-gray-500">| {employee?.role}</span>
              </div>
              <Link 
                href="/admin/upload-employees"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                직원 추가
              </Link>
              <Link 
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 mr-8">
            <div className="bg-white rounded-lg shadow p-4">
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">🏠</span>
                    대시보드
                  </Link>
                </li>
                <li>
                  <Link href="/posts/all" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">📢</span>
                    전체 공지
                  </Link>
                </li>
                <li>
                  <Link href="/posts/department" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">🏢</span>
                    부서별 공지
                  </Link>
                </li>
                <li>
                  <Link href="/posts/create" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">✏️</span>
                    게시글 작성
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">🔍</span>
                    검색
                  </Link>
                </li>
                
                {/* 관리자 메뉴 */}
                <li className="pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    관리자
                  </div>
                </li>
                <li>
                  <Link href="/admin/upload-employees" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">👥</span>
                    직원 명단 업로드
                  </Link>
                </li>
                <li>
                  <Link href="/admin/employee-list" className="flex items-center p-2 text-blue-600 bg-blue-50 rounded">
                    <span className="mr-3">📋</span>
                    직원 목록 관리
                  </Link>
                </li>
                
                <li>
                  <Link href="/settings" className="flex items-center p-2 text-gray-700 hover:bg-gray-50 rounded">
                    <span className="mr-3">⚙️</span>
                    설정
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">👥 직원 목록</h2>
                <div className="text-sm text-gray-500">
                  총 {filteredEmployees.length}명
                </div>
              </div>

              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="이름, 사번, 이메일, 부서로 검색..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Employee List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사번
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이메일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          직급
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          부서
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          마지막 로그인
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {emp.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.department_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              emp.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {emp.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {emp.last_login 
                              ? new Date(emp.last_login).toLocaleDateString('ko-KR')
                              : '없음'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {/* 권한 검증: SUPER_ADMIN이거나 같은 부서의 DEPARTMENT_ADMIN만 관리 가능 */}
                            {(employee.role === 'SUPER_ADMIN' || 
                              (employee.role === 'DEPARTMENT_ADMIN' && emp.department_id === employee.department_id)) && (
                              <>
                                <button
                                  onClick={() => handleToggleActive(emp.id, emp.is_active)}
                                  className={`px-3 py-1 rounded text-xs ${
                                    emp.is_active
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {emp.is_active ? '비활성화' : '활성화'}
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                            {/* 권한이 없는 경우 */}
                            {!(employee.role === 'SUPER_ADMIN' || 
                              (employee.role === 'DEPARTMENT_ADMIN' && emp.department_id === employee.department_id)) && (
                              <span className="text-xs text-gray-400">권한 없음</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
