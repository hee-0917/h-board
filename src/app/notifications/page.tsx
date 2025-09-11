'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNotificationsStore } from '@/store/notifications'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default function NotificationsPage() {
  const { employee } = useAuthStore()
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationsStore()
  const router = useRouter()

  // 알림 데이터 로드
  useEffect(() => {
    if (employee?.id) {
      fetchNotifications(employee.id)
    }
  }, [employee?.id])

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      })
      
      if (response.ok) {
        markAsRead(notificationId)
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // 모든 읽지 않은 알림을 읽음 처리
      const unreadNotifications = notifications.filter(n => !n.is_read)
      await Promise.all(
        unreadNotifications.map(notif => 
          fetch(`/api/notifications/${notif.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: true })
          })
        )
      )
      markAllAsRead()
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        deleteNotification(notificationId)
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            로그인하기
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
                <span className="hidden sm:inline">🔔 알림</span>
                <span className="sm:hidden">🔔</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700">{employee.name}</span>
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
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <Sidebar currentPath="/notifications" />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🔔 알림</h2>
                  <p className="text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다.` : '모든 알림을 확인했습니다.'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    모두 읽음으로 표시
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-lg">로딩 중...</div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-lg text-gray-500">알림이 없습니다.</div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 ${
                        notification.is_read 
                          ? 'border-gray-200' 
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <h3 className={`font-medium ${
                              notification.is_read ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                새 알림
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatTimeAgo(notification.created_at)}</span>
                            {notification.post_id && (
                              <Link
                                href={`/posts/${notification.post_id}`}
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                게시글 보기
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              읽음
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}