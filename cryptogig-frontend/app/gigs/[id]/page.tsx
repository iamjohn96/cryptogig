'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { supabase } from '@/lib/supabase'
import { Gig } from '@/lib/hooks/useGigs'
import Link from 'next/link'

export default function GigDetailPage() {
  const { id } = useParams()
  const { address, isConnected } = useAccount()
  const router = useRouter()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGig() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) setError(error.message)
      else setGig(data)
      setLoading(false)
    }
    fetchGig()
  }, [id])

  async function handleApply() {
    if (!address) return
    setApplying(true)
    setError(null)

    try {
      // 유저 찾기
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single()

      if (!user) throw new Error('User not found')

      // 이미 지원했는지 확인
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('freelancer_id', user.id)
        .single()

      if (existing) {
        setApplied(true)
        return
      }

      // 지원 등록
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          freelancer_id: user.id,
          status: 'PENDING'
        })

      if (error) throw error
      setApplied(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  if (!gig) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Gig not found
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/gigs" className="text-xl font-bold text-purple-400">
          CryptoGig
        </Link>
        <ConnectButton />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* 뒤로가기 */}
        <Link href="/gigs" className="text-gray-400 hover:text-white text-sm mb-6 block">
          ← Back to Gigs
        </Link>

        {/* 기그 정보 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{gig.title}</h1>
            <span className="bg-green-900 text-green-400 text-xs px-2 py-1 rounded-full">
              Open
            </span>
          </div>

          <p className="text-gray-300 mb-6 leading-relaxed">{gig.description}</p>

          {/* 스킬 태그 */}
          {gig.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {gig.skills_required.map((skill) => (
                <span key={skill} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* 예산 & 카테고리 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Budget</p>
              <p className="text-purple-400 font-bold text-xl">{gig.budget} USDC</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Category</p>
              <p className="text-white font-semibold">{gig.category || 'Uncategorized'}</p>
            </div>
          </div>

          <p className="text-gray-500 text-xs">
            Posted: {new Date(gig.created_at).toLocaleDateString('en-US')}
          </p>
        </div>

        {/* 지원하기 */}
        {!isConnected ? (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">Please connect your wallet to apply</p>
            <ConnectButton />
          </div>
        ) : applied ? (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 text-center">
            <p className="text-green-400 font-semibold text-lg">✅ Application Submitted!</p>
            <p className="text-gray-400 text-sm mt-2">Waiting for the client to accept</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Apply for this Gig</h3>
            <p className="text-gray-400 text-sm mb-6">
              Applying notifies the client, and a contract starts upon acceptance.
            </p>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
            >
              {applying ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}