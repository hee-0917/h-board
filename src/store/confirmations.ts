import { create } from 'zustand'
import { PostConfirmation } from '@/types/database'
import { confirmationApi, employeeApi } from '@/lib/supabase/api'

interface ConfirmationWithEmployee extends PostConfirmation {
  employee_name: string
}

interface ConfirmationsState {
  confirmations: ConfirmationWithEmployee[]
  isLoading: boolean
  error: string | null
  fetchConfirmations: () => Promise<void>
  confirmPost: (postId: number, employeeId: number) => Promise<boolean>
  unconfirmPost: (postId: number, employeeId: number) => Promise<boolean>
  getConfirmationsByPost: (postId: number) => ConfirmationWithEmployee[]
  isPostConfirmedByEmployee: (postId: number, employeeId: number) => boolean
  getConfirmationCount: (postId: number) => number
}

export const useConfirmationsStore = create<ConfirmationsState>((set, get) => ({
  confirmations: [],
  isLoading: false,
  error: null,

  fetchConfirmations: async () => {
    set({ isLoading: true, error: null })
    try {
      const confirmations = await confirmationApi.getAll()
      const employees = await employeeApi.getAll()
      
      // 직원 이름 정보 추가
      const confirmationsWithNames = confirmations.map(confirmation => ({
        ...confirmation,
        employee_name: employees.find(emp => emp.id === confirmation.employee_id)?.name || 'Unknown'
      }))

      set({ confirmations: confirmationsWithNames, isLoading: false })
    } catch (error) {
      console.error('Error fetching confirmations:', error)
      set({ error: 'Failed to fetch confirmations', isLoading: false })
    }
  },

  confirmPost: async (postId: number, employeeId: number) => {
    try {
      const success = await confirmationApi.confirm(postId, employeeId)
      if (success) {
        // 확인 목록 다시 가져오기
        await get().fetchConfirmations()
        return true
      }
      return false
    } catch (error) {
      console.error('Error confirming post:', error)
      set({ error: 'Failed to confirm post' })
      return false
    }
  },

  unconfirmPost: async (postId: number, employeeId: number) => {
    try {
      // unconfirm API가 없으므로 임시로 false 반환
      console.log('unconfirm API not implemented')
      return false
    } catch (error) {
      console.error('Error unconfirming post:', error)
      set({ error: 'Failed to unconfirm post' })
      return false
    }
  },

  getConfirmationsByPost: (postId: number) => {
    const { confirmations } = get()
    return confirmations.filter(confirmation => confirmation.post_id === postId)
  },

  isPostConfirmedByEmployee: (postId: number, employeeId: number) => {
    const { confirmations } = get()
    return confirmations.some(
      confirmation => confirmation.post_id === postId && confirmation.employee_id === employeeId
    )
  },

  getConfirmationCount: (postId: number) => {
    const { confirmations } = get()
    return confirmations.filter(confirmation => confirmation.post_id === postId).length
  }
}))

// 기존 형식과의 호환성을 위한 헬퍼 함수
export const convertToLegacyConfirmation = (confirmation: ConfirmationWithEmployee) => ({
  id: confirmation.id.toString(),
  post_id: confirmation.post_id.toString(),
  employee_id: confirmation.employee_id.toString(),
  employee_name: confirmation.employee_name,
  confirmed_at: confirmation.confirmed_at
})