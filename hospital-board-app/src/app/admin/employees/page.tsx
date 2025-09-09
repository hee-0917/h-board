'use client'

import { useState, useEffect } from 'react'
import { UserRole, ROLE_DESCRIPTIONS } from '@/types/roles'
import AdminLayout from '@/components/layout/AdminLayout'
import { SuperAdminOnly } from '@/components/auth/RoleGuard'

interface Employee {
  id: string
  employee_id: string
  name: string
  email: string
  department_id: string
  position: string
  role: UserRole
  phone?: string
  hire_date?: string
  is_active: boolean
  last_login?: string
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Mock 데이터 초기화
  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: 'EMP001',
        employee_id: 'EMP001',
        name: '김의사',
        email: 'kim@hospital.com',
        department_id: '의료진',
        position: '주치의',
        role: UserRole.USER,
        phone: '010-1234-5678',
        hire_date: '2023-01-15',
        is_active: true,
        last_login: '2024-12-06T10:30:00'
      },
      {
        id: 'EMP002',
        employee_id: 'EMP002',
        name: '이간호사팀장',
        email: 'lee@hospital.com',
        department_id: '의료진',
        position: '수간호사',
        role: UserRole.DEPARTMENT_ADMIN,
        phone: '010-2345-6789',
        hire_date: '2022-03-20',
        is_active: true,
        last_login: '2024-12-06T14:20:00'
      },
      {
        id: 'EMP003',
        employee_id: 'EMP003',
        name: '박관리자',
        email: 'park@hospital.com',
        department_id: '행정팀',
        position: '팀장',
        role: UserRole.SUPER_ADMIN,
        phone: '010-3456-7890',
        hire_date: '2020-05-10',
        is_active: true,
        last_login: '2024-12-06T15:00:00'
      },
      {
        id: 'EMP004',
        employee_id: 'EMP004',
        name: '최약사',
        email: 'choi@hospital.com',
        department_id: '약제팀',
        position: '약사',
        role: UserRole.USER,
        phone: '010-4567-8901',
        hire_date: '2023-07-01',
        is_active: true,
        last_login: '2024-12-06T09:15:00'
      },
      {
        id: 'EMP005',
        employee_id: 'EMP005',
        name: '정홍보팀',
        email: 'jung@hospital.com',
        department_id: '홍보팀',
        position: '담당자',
        role: UserRole.MODERATOR,
        phone: '010-5678-9012',
        hire_date: '2023-09-15',
        is_active: true,
        last_login: '2024-12-05T16:45:00'
      },
      {
        id: 'EMP006',
        employee_id: 'EMP006',
        name: '김간호사',
        email: 'kim2@hospital.com',
        department_id: '의료진',
        position: '간호사',
        role: UserRole.USER,
        phone: '010-6789-0123',
        hire_date: '2024-01-10',
        is_active: false,
        last_login: '2024-11-20T12:00:00'
      }
    ]

    setEmployees(mockEmployees)
    setIsLoading(false)
  }, [])

  // 필터링된 직원 목록
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = !selectedDepartment || employee.department_id === selectedDepartment
    const matchesRole = !selectedRole || employee.role === selectedRole

    return matchesSearch && matchesDepartment && matchesRole
  })

  const departments = Array.from(new Set(employees.map(emp => emp.department_id)))

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return '로그인 기록 없음'
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}일 전`
  }

  const toggleEmployeeStatus = (employeeId: string) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, is_active: !emp.is_active }
        : emp
    ))
  }

  const updateEmployeeRole = (employeeId: string, newRole: UserRole) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId 
        ? { ...emp, role: newRole }
        : emp
    ))
  }

  if (isLoading) {
    return (
      <SuperAdminOnly>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        </AdminLayout>
      </SuperAdminOnly>
    )
  }

  return (
    <SuperAdminOnly>
      <AdminLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
                <p className="text-gray-600">전체 직원 현황을 관리하고 권한을 설정하세요</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <span className="mr-2">➕</span>
                신규 직원 등록
              </button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-gray-900">{employees.length}</div>
              <div className="text-sm text-gray-500">총 직원 수</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-green-600">
                {employees.filter(emp => emp.is_active).length}
              </div>
              <div className="text-sm text-gray-500">재직 중</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-red-600">
                {employees.filter(emp => !emp.is_active).length}
              </div>
              <div className="text-sm text-gray-500">휴직/퇴사</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-3xl font-bold text-blue-600">
                {employees.filter(emp => emp.role !== UserRole.USER).length}
              </div>
              <div className="text-sm text-gray-500">관리자</div>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
                <input
                  type="text"
                  placeholder="이름, 사번, 이메일로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">전체 부서</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">전체 권한</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>
                      {ROLE_DESCRIPTIONS[role].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDepartment('')
                    setSelectedRole('')
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </div>

          {/* 직원 목록 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서/직책
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      권한
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마지막 로그인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employee_id}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department_id}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={employee.role}
                          onChange={(e) => updateEmployeeRole(employee.id, e.target.value as UserRole)}
                          className={`text-xs px-2 py-1 rounded-full border ${
                            employee.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 border-red-300' :
                            employee.role === 'DEPARTMENT_ADMIN' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            employee.role === 'MODERATOR' ? 'bg-green-100 text-green-800 border-green-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>
                              {ROLE_DESCRIPTIONS[role].icon} {ROLE_DESCRIPTIONS[role].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            employee.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {employee.is_active ? '✅ 재직' : '❌ 휴직'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastLogin(employee.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          {employee.is_active ? '비활성화' : '활성화'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 결과 요약 */}
          <div className="text-sm text-gray-500 text-center">
            전체 {employees.length}명 중 {filteredEmployees.length}명 표시
          </div>
        </div>
      </AdminLayout>
    </SuperAdminOnly>
  )
}
