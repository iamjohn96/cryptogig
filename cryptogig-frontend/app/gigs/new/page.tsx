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
        <p className="text-gray-400">Please connect your wallet to post a gig</p>
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
        <h2 className="text-2xl font-bold mb-8">Post a Gig</h2>

        <div className="flex flex-col gap-5">

          {/* 제목 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input
              type="text"
              placeholder="e.g. Looking for a React Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              placeholder="Describe the project, requirements, and expectations in detail"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* 예산 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Budget (USDC)</label>
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
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a category</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Content">Content</option>
              <option value="Translation">Translation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 스킬 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Required Skills <span className="text-gray-500">(comma-separated)</span>
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
            {loading ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      </div>
    </main>
  )
}