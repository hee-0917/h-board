'use client'

import { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setEmployee, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // 현재 세션 확인
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // 직원 정보 가져오기
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (employee) {
          setEmployee(employee)
        }
      }
      
      setLoading(false)
    }

    getInitialSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          
          // 직원 정보 가져오기
          const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (employee) {
            setEmployee(employee)
          }
          
          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setEmployee(null)
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setEmployee, setLoading, router])

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}
