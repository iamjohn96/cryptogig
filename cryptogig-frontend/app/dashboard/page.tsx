'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Application = {
  id: string
  status: string
  created_at: string
  freelancer_id: string
  freelancer: { wallet_address: string; name: string | null } | null
  job: { id: string; title: string; budget: number } | null
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return
    fetchApplications()
  }, [address])

  async function fetchApplications() {
    setLoading(true)

    // 클라이언트 유저 ID 조회
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .single()

    if (!user) { setLoading(false); return }

    // 내가 올린 기그의 지원자 목록
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, status, created_at, freelancer_id,
        freelancer:users!applications_freelancer_id_fkey(wallet_address, name),
        job:jobs!applications_job_id_fkey(id, title, budget)
      `)
      .eq('jobs.client_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setApplications(data as any)
    setLoading(false)
  }

  async function handleAccept(app: Application) {
    if (!address) return
    setAccepting(app.id)

    try {
      // 클라이언트 & 프리랜서 user ID 조회
      const { data: clientUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single()

      if (!clientUser) throw new Error('Client not found')

      // applications 상태 업데이트
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: 'ACCEPTED' })
        .eq('id', app.id)

      if (appError) throw appError

      // contracts 생성
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          job_id: app.job?.id,
          client_id: clientUser.id,
          freelancer_id: app.freelancer_id,
          amount: app.job?.budget ?? 0,
          status: 'LOCKED',
        })
        .select('id')
        .single()

      if (contractError) throw contractError

      router.push(`/contracts/${contract.id}`)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setAccepting(null)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Connect your wallet to view dashboard</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">CryptoGig</Link>
        <div className="flex gap-4 items-center">
          <Link href="/gigs" className="text-gray-400 hover:text-white text-sm">Browse Gigs</Link>
          <Link href="/messages" className="text-gray-400 hover:text-white text-sm">Messages</Link>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">Client Dashboard</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p>No applications yet.</p>
            <Link href="/gigs/new" className="text-purple-400 hover:underline mt-2 inline-block">
              Post a gig to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const freelancerAddr = app.freelancer?.wallet_address ?? ''
              const shortAddr = freelancerAddr
                ? `${freelancerAddr.slice(0, 6)}...${freelancerAddr.slice(-4)}`
                : 'Unknown'

              return (
                <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold mb-1">
                        {app.job?.title ?? 'Unknown Gig'}
                      </p>
                      <p className="text-gray-400 text-sm mb-1">
                        Applicant:{' '}
                        <Link
                          href={`/profile/${freelancerAddr}`}
                          className="text-purple-400 hover:underline font-mono"
                        >
                          {app.freelancer?.name ?? shortAddr}
                        </Link>
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(app.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${app.status === 'ACCEPTED'
                          ? 'bg-green-900/40 text-green-400'
                          : app.status === 'PENDING'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-gray-800 text-gray-400'
                        }`}>
                        {app.status}
                      </span>

                      {app.status === 'PENDING' && (
                        <button
                          onClick={() => handleAccept(app)}
                          disabled={accepting === app.id}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-all"
                        >
                          {accepting === app.id ? 'Processing...' : 'Accept'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}