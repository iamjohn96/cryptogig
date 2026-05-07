import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/lib/supabase'

export function useUser() {
  const { address, isConnected } = useAccount()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null)
      return
    }

    async function syncUser() {
      setLoading(true)
      try {
        // 기존 유저 찾기
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', address)
          .single()

        if (existing) {
          setUser(existing)
          return
        }

        // 없으면 새로 생성
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ wallet_address: address })
          .select()
          .single()

        if (error) throw error
        setUser(newUser)
      } catch (err) {
        console.error('유저 동기화 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    syncUser()
  }, [address, isConnected])

  return { user, loading }
}