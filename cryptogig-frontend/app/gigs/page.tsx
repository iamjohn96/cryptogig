'use client'

import { useGigs } from '@/lib/hooks/useGigs'
import { GigCard } from '@/components/GigCard'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function GigsPage() {
  const { gigs, loading, error } = useGigs()
  const { isConnected } = useAccount()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">
          CryptoGig
        </Link>
        <div className="flex gap-4 items-center">
          {isConnected && (
            <Link
              href="/gigs/new"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              + Post Gig
            </Link>
          )}
          <ConnectButton />
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Gig Listings</h2>

        {loading && (
          <div className="text-gray-400 text-center py-20">Loading...</div>
        )}

        {error && (
          <div className="text-red-400 text-center py-20">{error}</div>
        )}

        {!loading && gigs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No gigs posted yet</p>
            {isConnected && (
              <Link
                href="/gigs/new"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                Post the First Gig
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      </div>
    </main>
  )
}