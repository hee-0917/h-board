import { create } from 'zustand'

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'urgent' | 'success'
  is_read: boolean
  employee_id: number
  post_id?: number
  created_at: string
  updated_at: string
  posts?: {
    id: number
    title: string
    content: string
    created_at: string
  }
}

interface NotificationsStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  deleteNotification: (id: number) => void
  setLoading: (loading: boolean) => void
  fetchNotifications: (employeeId: number) => Promise<void>
  updateNotification: (id: number, updates: Partial<Notification>) => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.is_read).length
    console.log('🔔 setNotifications 호출됨 - 알림 개수:', notifications.length, '미읽음:', unreadCount)
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications]
      const unreadCount = newNotifications.filter(n => !n.is_read).length
      return { 
        notifications: newNotifications, 
        unreadCount 
      }
    })
  },

  markAsRead: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      )
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length
      return { 
        notifications: updatedNotifications, 
        unreadCount 
      }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n => ({ ...n, is_read: true }))
      return { 
        notifications: updatedNotifications, 
        unreadCount: 0 
      }
    })
  },

  deleteNotification: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.filter(n => n.id !== id)
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length
      return { 
        notifications: updatedNotifications, 
        unreadCount 
      }
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  updateNotification: (id, updates) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, ...updates } : n
      )
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length
      return { 
        notifications: updatedNotifications, 
        unreadCount 
      }
    })
  },

  fetchNotifications: async (employeeId) => {
    console.log('🔔 알림 조회 시작, employeeId:', employeeId)
    set({ isLoading: true })
    try {
      const response = await fetch(`/api/notifications?employee_id=${employeeId}`)
      console.log('🔔 API 응답 상태:', response.status)
      if (response.ok) {
        const notifications = await response.json()
        console.log('🔔 받은 알림 데이터:', notifications)
        get().setNotifications(notifications)
      } else {
        const errorText = await response.text()
        console.error('🔔 알림 조회 실패:', response.status, errorText)
      }
    } catch (error) {
      console.error('🔔 알림 조회 오류:', error)
    } finally {
      set({ isLoading: false })
    }
  }
}))
