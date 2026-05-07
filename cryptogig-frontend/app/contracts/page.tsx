'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Contract = {
  id: string
  amount: number
  status: string
  contract_address: string | null
  tx_hash: string | null
  created_at: string
  job_id: string
  client_id: string
  freelancer_id: string
  jobs: { title: string }
  client: { wallet_address: string }
  freelancer: { wallet_address: string }
}

export default function ContractsPage() {
  const { address, isConnected } = useAccount()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    fetchContracts()
  }, [address])

  async function fetchContracts() {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .single()

    if (!user) return

    const { data } = await supabase
      .from('contracts')
      .select(`
        *,
        jobs ( title ),
        client:users!contracts_client_id_fkey ( wallet_address ),
        freelancer:users!contracts_freelancer_id_fkey ( wallet_address )
      `)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    setContracts((data as any) || [])
    setLoading(false)
  }

  if (!isConnected) return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400">계약을 보려면 지갑을 연결해주세요</p>
      <ConnectButton />
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">CryptoGig</Link>
        <div className="flex gap-4 items-center">
          <Link href="/gigs" className="text-gray-400 hover:text-white text-sm">기그 목록</Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">대시보드</Link>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">내 계약</h2>

        {loading && <p className="text-gray-400">로딩 중...</p>}

        {!loading && contracts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">진행 중인 계약이 없어요</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {contracts.map((contract) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`}>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold">{contract.jobs?.title}</h3>
                  <span className="bg-blue-900 text-blue-400 text-xs px-2 py-1 rounded-full">
                    {contract.status}
                  </span>
                </div>
                <p className="text-purple-400 font-bold">{contract.amount} USDC</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(contract.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}