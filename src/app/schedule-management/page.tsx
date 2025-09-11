'use client'

import { useAuthStore } from '@/store/auth'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface Employee {
  id: number
  name: string
  employee_id: string
  department_id: number
  department_name?: string
}

interface ScheduleEvent {
  id: string
  employee_id: number
  employee_name: string
  title: string
  type: 'annual_leave' | 'half_day' | 'quarter_day' | 'training' | 'other'
  date: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
}

interface EmployeeStats {
  employee_id: number
  employee_name: string
  annual_leave: number
  half_day: number
  quarter_day: number
  training: number
  other: number
  total: number
}

export default function ScheduleManagementPage() {
  const { employee } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([])
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    fetchEmployees()
  }, [employee])

  useEffect(() => {
    if (!employee || employees.length === 0) return
    fetchScheduleEvents()
  }, [employee, employees, currentMonth])

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/employees?department_id=${employee?.department_id}`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        console.error('직원 정보 조회 실패')
        // 실패시 빈 배열로 설정
        setEmployees([])
      }
    } catch (error) {
      console.error('직원 정보 조회 오류:', error)
      setEmployees([])
    }
  }

  const fetchScheduleEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/calendar?department_id=${employee?.department_id}`)
      
      if (response.ok) {
        const calendarData = await response.json()
        
        // 직원 정보와 캘린더 데이터를 매핑
        const formattedEvents: ScheduleEvent[] = calendarData.map((event: any) => {
          const eventEmployee = employees.find(emp => emp.id === event.employee_id)
          return {
            id: event.id.toString(),
            employee_id: event.employee_id,
            employee_name: eventEmployee?.name || '알 수 없음',
            title: event.title,
            type: event.type,
            date: event.date,
            description: event.description,
            status: event.status || 'approved'
          }
        })
        
        setScheduleEvents(formattedEvents)
        
        // 통계 계산
        const stats = calculateStats(formattedEvents)
        setEmployeeStats(stats)
      } else {
        console.error('일정 정보 조회 실패')
        setScheduleEvents([])
        setEmployeeStats([])
      }
    } catch (error) {
      console.error('일정 정보 조회 오류:', error)
      setScheduleEvents([])
      setEmployeeStats([])
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (events: ScheduleEvent[]): EmployeeStats[] => {
    const statsMap = new Map<number, EmployeeStats>()
    
    // 모든 직원을 초기화
    employees.forEach(emp => {
      statsMap.set(emp.id, {
        employee_id: emp.id,
        employee_name: emp.name,
        annual_leave: 0,
        half_day: 0,
        quarter_day: 0,
        training: 0,
        other: 0,
        total: 0
      })
    })

    // 선택된 월의 이벤트만 필터링
    const currentYear = currentMonth.getFullYear()
    const currentMonthNum = currentMonth.getMonth() + 1
    
    const monthlyEvents = events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.getFullYear() === currentYear && 
             eventDate.getMonth() + 1 === currentMonthNum &&
             event.status === 'approved'
    })

    // 승인된 일정만 계산
    monthlyEvents.forEach(event => {
      const stat = statsMap.get(event.employee_id)
      if (stat) {
        stat[event.type]++
        stat.total++
      }
    })

    return Array.from(statsMap.values())
  }

  const getFilteredEvents = () => {
    let filtered = scheduleEvents
    
    // 선택된 월의 이벤트만 필터링
    const currentYear = currentMonth.getFullYear()
    const currentMonthNum = currentMonth.getMonth() + 1
    
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.getFullYear() === currentYear && 
             eventDate.getMonth() + 1 === currentMonthNum
    })
    
    if (selectedEmployee) {
      filtered = filtered.filter(event => event.employee_id.toString() === selectedEmployee)
    }
    
    if (selectedType) {
      filtered = filtered.filter(event => event.type === selectedType)
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'annual_leave': return '🏖️'
      case 'half_day': return '🌅'
      case 'quarter_day': return '⏰'
      case 'training': return '📚'
      case 'other': return '📝'
      default: return '📅'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'annual_leave': return '연차'
      case 'half_day': return '반차'
      case 'quarter_day': return '1/4차'
      case 'training': return '교육'
      case 'other': return '기타'
      default: return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">✅ 승인</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">⏳ 대기</span>
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">❌ 거부</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>
    }
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로그인이 필요합니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full opacity-3 blur-3xl"></div>
      </div>

      {/* Header */}
      <Header showAdminMode={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <Sidebar currentPath="/schedule-management" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6 sm:space-y-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    📊 일정 관리
                  </h2>
                  <p className="text-gray-600 text-lg">
                    부서 직원들의 월별 일정 현황을 관리하세요
                  </p>
                </div>
                
                {/* 월 선택 컨트롤 */}
                <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-semibold text-gray-900 min-w-[120px] text-center px-4 py-2 bg-white/80 rounded-lg border border-gray-300">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    오늘
                  </button>
                </div>
              </div>

              {/* 월별 통계 카드 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">📈</span>
                  이번 달 일정 통계
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월)
                  </span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-red-800 text-2xl font-bold">
                      {employeeStats.reduce((sum, stat) => sum + stat.annual_leave, 0)}
                    </div>
                    <div className="text-red-600 text-sm">🏖️ 총 연차</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-orange-800 text-2xl font-bold">
                      {employeeStats.reduce((sum, stat) => sum + stat.half_day, 0)}
                    </div>
                    <div className="text-orange-600 text-sm">🌅 총 반차</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-yellow-800 text-2xl font-bold">
                      {employeeStats.reduce((sum, stat) => sum + stat.quarter_day, 0)}
                    </div>
                    <div className="text-yellow-600 text-sm">⏰ 총 1/4차</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-800 text-2xl font-bold">
                      {employeeStats.reduce((sum, stat) => sum + stat.training, 0)}
                    </div>
                    <div className="text-green-600 text-sm">📚 총 교육</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-blue-800 text-2xl font-bold">
                      {employeeStats.reduce((sum, stat) => sum + stat.other, 0)}
                    </div>
                    <div className="text-blue-600 text-sm">📝 총 기타</div>
                  </div>
                </div>
              </div>

              {/* 직원별 통계 테이블 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">👥</span>
                  직원별 일정 현황
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold">직원명</th>
                        <th className="text-center p-3 font-semibold">🏖️ 연차</th>
                        <th className="text-center p-3 font-semibold">🌅 반차</th>
                        <th className="text-center p-3 font-semibold">⏰ 1/4차</th>
                        <th className="text-center p-3 font-semibold">📚 교육</th>
                        <th className="text-center p-3 font-semibold">📝 기타</th>
                        <th className="text-center p-3 font-semibold">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeStats.map(stat => (
                        <tr key={stat.employee_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{stat.employee_name}</td>
                          <td className="text-center p-3">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              {stat.annual_leave}일
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                              {stat.half_day}회
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                              {stat.quarter_day}회
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              {stat.training}일
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {stat.other}회
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium font-bold">
                              {stat.total}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 필터 및 일정 목록 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">📋</span>
                  상세 일정 목록
                </h3>

                {/* 필터 컨트롤 */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <select 
                    value={selectedEmployee} 
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">전체 직원</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">모든 일정 유형</option>
                    <option value="annual_leave">🏖️ 연차</option>
                    <option value="half_day">🌅 반차</option>
                    <option value="quarter_day">⏰ 1/4차</option>
                    <option value="training">📚 교육</option>
                    <option value="other">📝 기타</option>
                  </select>

                  <button 
                    onClick={() => {setSelectedEmployee(''); setSelectedType('')}}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                  >
                    필터 초기화
                  </button>
                </div>

                {/* 일정 목록 */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-lg text-gray-500">로딩 중...</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredEvents().map(event => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">
                              {getTypeIcon(event.type)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {event.employee_name} - {event.title}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center space-x-4">
                                <span>📅 {event.date}</span>
                                <span>🏷️ {getTypeName(event.type)}</span>
                                {event.description && (
                                  <span>💭 {event.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(event.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {getFilteredEvents().length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-gray-500">조건에 맞는 일정이 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}