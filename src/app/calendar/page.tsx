'use client'

import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Calendar from '@/components/Calendar'

export default function CalendarPage() {
  const { employee } = useAuthStore()

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
          {/* Sidebar - Imported Component */}
          <Sidebar currentPath="/calendar" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6 sm:space-y-8">
              {/* Calendar Header */}
              <div className="text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  📅 부서 캘린더
                </h2>
                <p className="text-gray-600 text-lg">
                  부서의 일정과 스케줄을 관리하세요
                </p>
              </div>

              {/* Calendar Section */}
              <section>
                <Calendar />
              </section>

              {/* Calendar Features Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💡</span>
                  캘린더 기능 안내
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">🏖️ 연차</div>
                    <span className="text-sm text-gray-600">연차 휴가</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">🌅 반차</div>
                    <span className="text-sm text-gray-600">반일 휴가</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">⏰ 1/4차</div>
                    <span className="text-sm text-gray-600">단시간 휴가</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">📚 교육</div>
                    <span className="text-sm text-gray-600">교육 및 연수</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">📝 기타</div>
                    <span className="text-sm text-gray-600">기타 일정</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 flex items-center">
                    <span className="mr-2">📝</span>
                    <strong>사용 방법:</strong> 날짜를 클릭하여 새로운 일정을 추가하거나 기존 일정을 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}