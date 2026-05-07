'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useUser } from '@/lib/hooks/useUser'

export default function Home() {
  const { address, isConnected } = useAccount()
  useUser()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-400">CryptoGig</h1>
        <div className="flex gap-4 items-center">
          <Link href="/gigs" className="text-gray-400 hover:text-white text-sm transition-all">
            Browse Gigs
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* 메인 */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        {isConnected ? (
          <div className="text-center">
            <p className="text-green-400 text-lg font-semibold mb-2">✅ Wallet Connected</p>
            <p className="text-gray-400 text-sm mb-8">{address}</p>
            <div className="flex gap-4">
              <Link
                href="/gigs"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                Browse Gigs
              </Link>
              <Link
                href="/gigs/new"
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                Post a Gig
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Work with Crypto <br />
              <span className="text-purple-400">Get paid instantly</span>
            </h2>
            <p className="text-gray-400 mb-8">
              Secured by smart contract escrow
            </p>
            <div className="flex flex-col items-center gap-4">
              <ConnectButton label="Connect Wallet" />
              <Link href="/gigs" className="text-gray-400 hover:text-white text-sm transition-all">
                Browse →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}