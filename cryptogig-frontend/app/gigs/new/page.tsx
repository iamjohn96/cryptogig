'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { createGig } from '@/lib/hooks/useGigs'
import Link from 'next/link'

export default function NewGigPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    skills: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!address) return
    setLoading(true)
    setError(null)

    try {
      await createGig({
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        category: form.category,
        skills_required: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        wallet_address: address,
      })
      router.push('/gigs')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">기그를 등록하려면 지갑을 연결해주세요</p>
        <ConnectButton />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">
          CryptoGig
        </Link>
        <ConnectButton />
      </header>

      {/* 폼 */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">기그 등록</h2>

        <div className="flex flex-col gap-5">

          {/* 제목 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">제목</label>
            <input
              type="text"
              placeholder="예: React 개발자 구합니다"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">상세 설명</label>
            <textarea
              placeholder="프로젝트 내용, 요구사항 등을 자세히 적어주세요"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* 예산 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">예산 (USDC)</label>
            <input
              type="number"
              placeholder="예: 500"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">카테고리</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">선택해주세요</option>
              <option value="개발">개발</option>
              <option value="디자인">디자인</option>
              <option value="마케팅">마케팅</option>
              <option value="콘텐츠">콘텐츠</option>
              <option value="번역">번역</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 스킬 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              필요 스킬 <span className="text-gray-500">(쉼표로 구분)</span>
            </label>
            <input
              type="text"
              placeholder="예: React, TypeScript, Solidity"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.budget}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
          >
            {loading ? '등록 중...' : '기그 등록하기'}
          </button>
        </div>
      </div>
    </main>
  )
}