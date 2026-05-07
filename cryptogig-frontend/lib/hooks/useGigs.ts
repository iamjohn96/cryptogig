import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type Gig = {
  id: string
  title: string
  description: string
  budget: number
  currency: string
  category: string
  skills_required: string[]
  status: string
  created_at: string
  client_id: string
}

// 기그 목록 가져오기
export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGigs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'OPEN')
          .order('created_at', { ascending: false })

        if (error) throw error
        setGigs(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGigs()
  }, [])

  return { gigs, loading, error }
}

// 기그 등록
export async function createGig(gig: {
  title: string
  description: string
  budget: number
  category: string
  skills_required: string[]
  wallet_address: string
}) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', gig.wallet_address)
    .single()

  if (!user) throw new Error('유저를 찾을 수 없습니다')

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      client_id: user.id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      category: gig.category,
      skills_required: gig.skills_required,
      currency: 'USDC',
      status: 'OPEN'
    })
    .select()
    .single()

  if (error) throw error
  return data
}