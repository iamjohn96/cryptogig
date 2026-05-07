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
            기그 목록
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* 메인 */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        {isConnected ? (
          <div className="text-center">
            <p className="text-green-400 text-lg font-semibold mb-2">✅ 지갑 연결됨</p>
            <p className="text-gray-400 text-sm mb-8">{address}</p>
            <div className="flex gap-4">
              <Link
                href="/gigs"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                기그 둘러보기
              </Link>
              <Link
                href="/gigs/new"
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                기그 등록하기
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Crypto로 일하고 <br />
              <span className="text-purple-400">바로 받으세요</span>
            </h2>
            <p className="text-gray-400 mb-8">
              스마트 컨트랙트 기반 에스크로로 안전하게
            </p>
            <div className="flex flex-col items-center gap-4">
              <ConnectButton label="지갑 연결하기" />
              <Link href="/gigs" className="text-gray-400 hover:text-white text-sm transition-all">
                둘러보기 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}