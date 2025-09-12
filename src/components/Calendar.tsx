'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'annual_leave' | 'half_day' | 'quarter_day' | 'training' | 'other'
  description?: string
  department_id: number
}

interface CalendarProps {
  className?: string
}

export default function Calendar({ className = '' }: CalendarProps) {
  const { employee } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'annual_leave' as CalendarEvent['type'],
    description: ''
  })

  // 실제 API에서 이벤트 데이터 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      if (!employee) return

      try {
        const response = await fetch(`/api/calendar?department_id=${employee.department_id}`)
        if (response.ok) {
          const data = await response.json()
          // API 응답 데이터를 CalendarEvent 형식으로 변환
          const formattedEvents: CalendarEvent[] = data.map((event: any) => ({
            id: event.id.toString(),
            title: event.title,
            date: event.date,
            type: event.type,
            description: event.description,
            department_id: event.department_id
          }))
          setEvents(formattedEvents)
        } else {
          console.error('이벤트 데이터 조회 실패')
          // 실패시 빈 배열로 설정
          setEvents([])
        }
      } catch (error) {
        console.error('이벤트 데이터 조회 오류:', error)
        setEvents([])
      }
    }

    fetchEvents()
  }, [employee, currentDate])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isToday = (date: number) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === date
  }

  const getEventsForDate = (date: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return events.filter(event => event.date === dateString)
  }

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'annual_leave': return '🏖️'
      case 'half_day': return '🌅'
      case 'quarter_day': return '⏰'
      case 'training': return '📚'
      case 'other': return '📝'
      default: return '📅'
    }
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'annual_leave': return 'bg-red-100 text-red-800 border-red-200'
      case 'half_day': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'quarter_day': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'training': return 'bg-green-100 text-green-800 border-green-200'
      case 'other': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleDateClick = (date: number) => {
    setSelectedDate(new Date(year, month, date))
    setSelectedEvent(null)
    setIsEditMode(false)
    setNewEvent({ title: '', type: 'annual_leave', description: '' })
    setShowEventModal(true)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsEditMode(true)
    setNewEvent({
      title: event.title,
      type: event.type,
      description: event.description || ''
    })
    setSelectedDate(new Date(event.date))
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!selectedDate || !newEvent.title.trim() || !employee) return

    const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    
    try {
      if (isEditMode && selectedEvent) {
        // 수정 모드
        const response = await fetch('/api/calendar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: selectedEvent.id,
            title: newEvent.title,
            type: newEvent.type,
            date: dateString,
            description: newEvent.description
          })
        })

        if (response.ok) {
          const updatedEvent = await response.json()
          
          // 로컬 상태 업데이트
          const formattedEvent: CalendarEvent = {
            id: updatedEvent.id.toString(),
            title: updatedEvent.title,
            date: updatedEvent.date,
            type: updatedEvent.type,
            description: updatedEvent.description,
            department_id: updatedEvent.department_id
          }
          
          setEvents(events.map(event => 
            event.id === selectedEvent.id ? formattedEvent : event
          ))
          
          setNewEvent({ title: '', type: 'annual_leave', description: '' })
          setShowEventModal(false)
          setIsEditMode(false)
          setSelectedEvent(null)
          console.log('✅ 캘린더 이벤트 수정 성공')
        } else {
          console.error('캘린더 이벤트 수정 실패:', response.statusText)
          alert('일정 수정에 실패했습니다. 다시 시도해주세요.')
        }
      } else {
        // 생성 모드
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newEvent.title,
            type: newEvent.type,
            date: dateString,
            description: newEvent.description,
            employee_id: employee.id,
            department_id: employee.department_id
          })
        })

        if (response.ok) {
          const createdEvent = await response.json()
          
          // 새로운 이벤트를 로컬 상태에 추가
          const formattedEvent: CalendarEvent = {
            id: createdEvent.id.toString(),
            title: createdEvent.title,
            date: createdEvent.date,
            type: createdEvent.type,
            description: createdEvent.description,
            department_id: createdEvent.department_id
          }
          
          setEvents([...events, formattedEvent])
          setNewEvent({ title: '', type: 'annual_leave', description: '' })
          setShowEventModal(false)
          console.log('✅ 캘린더 이벤트 생성 성공')
        } else {
          console.error('캘린더 이벤트 생성 실패:', response.statusText)
          alert('일정 생성에 실패했습니다. 다시 시도해주세요.')
        }
      }
    } catch (error) {
      console.error('캘린더 이벤트 저장 오류:', error)
      alert('일정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/calendar?id=${selectedEvent.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 로컬 상태에서 이벤트 제거
        setEvents(events.filter(event => event.id !== selectedEvent.id))
        setShowEventModal(false)
        setIsEditMode(false)
        setSelectedEvent(null)
        setNewEvent({ title: '', type: 'annual_leave', description: '' })
        console.log('✅ 캘린더 이벤트 삭제 성공')
      } else {
        console.error('캘린더 이벤트 삭제 실패:', response.statusText)
        alert('일정 삭제에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('캘린더 이벤트 삭제 오류:', error)
      alert('일정 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleExcelDownload = async () => {
    if (!employee || !employee.department_id) return

    try {
      const params = new URLSearchParams({
        department_id: employee.department_id.toString(),
        year: year.toString(),
        month: (month + 1).toString()
      })

      const response = await fetch(`/api/calendar/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vacation_report_${year}_${String(month + 1).padStart(2, '0')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('✅ 엑셀 다운로드 성공')
      } else {
        console.error('엑셀 다운로드 실패:', response.statusText)
        alert('엑셀 다운로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error)
      alert('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full p-2 mr-3">
            <span className="text-white text-xl">📅</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">부서 스케줄</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-center">
            {year}년 {monthNames[month]}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleExcelDownload}
            className="ml-4 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            title="휴가현황 엑셀 다운로드"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm">엑셀</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before first day of month */}
        {Array.from({ length: firstDayWeekday }, (_, i) => (
          <div key={`empty-${i}`} className="p-2 h-20"></div>
        ))}
        
        {/* Days of month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = i + 1
          const dayEvents = getEventsForDate(date)
          
          return (
            <div
              key={date}
              onClick={() => handleDateClick(date)}
              className={`p-1 h-20 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${
                isToday(date) ? 'bg-blue-100 border-blue-300' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday(date) ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {date}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)}`}
                    title={`${event.title} - 클릭해서 수정/삭제`}
                  >
                    <span className="mr-1">{getEventTypeIcon(event.type)}</span>
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 2}개 더
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center">
          <span className="mr-1">🏖️</span>
          <span className="text-gray-600">연차</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">🌅</span>
          <span className="text-gray-600">반차</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">⏰</span>
          <span className="text-gray-600">1/4차</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">📚</span>
          <span className="text-gray-600">교육</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">📝</span>
          <span className="text-gray-600">기타</span>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정 {isEditMode ? '수정' : '추가'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일정 제목
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일정 유형
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="annual_leave">🏖️ 연차</option>
                  <option value="half_day">🌅 반차</option>
                  <option value="quarter_day">⏰ 1/4차</option>
                  <option value="training">📚 교육</option>
                  <option value="other">📝 기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="일정에 대한 상세 설명"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                {isEditMode && selectedEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600"
                >
                  {isEditMode ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}