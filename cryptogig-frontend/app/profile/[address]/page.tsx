'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type UserProfile = {
  id: string
  wallet_address: string
  name: string | null
  bio: string | null
  skills: string[] | null
  role: string | null
  avatar_url: string | null
  hourly_rate: number | null
  created_at: string
}

type CompletedGig = {
  id: string
  amount: number
  created_at: string
  jobs: { title: string } | null
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function AvatarCircle({ name, address }: { name: string | null; address: string }) {
  const letter = name ? name[0].toUpperCase() : address[2].toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
      {letter}
    </div>
  )
}

export default function ProfilePage() {
  const { address: paramAddress } = useParams<{ address: string }>()
  const { address: connectedAddress } = useAccount()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [completedGigs, setCompletedGigs] = useState<CompletedGig[]>([])
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalEarned: 0,
    activeContracts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editSkills, setEditSkills] = useState('')
  const [editHourlyRate, setEditHourlyRate] = useState('')

  const isOwner =
    connectedAddress?.toLowerCase() === paramAddress?.toLowerCase()

  useEffect(() => {
    if (!paramAddress) return
    fetchProfile()
  }, [paramAddress])

  async function fetchProfile() {
    setLoading(true)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', paramAddress)
      .single()

    if (error || !user) {
      // Auto-create a minimal profile so the page is always viewable
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: paramAddress })
        .select()
        .single()

      if (createError || !newUser) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(newUser as UserProfile)
      setLoading(false)
      return
    }

    setProfile(user as UserProfile)

    // Fetch contracts stats
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, amount, status, created_at, job_id, jobs(title)')
      .eq('freelancer_id', user.id)

    if (contracts) {
      const released = contracts.filter((c) => c.status === 'RELEASED')
      const active = contracts.filter(
        (c) => c.status === 'LOCKED' || c.status === 'COMPLETED'
      )
      const totalEarned = released.reduce((sum, c) => sum + (c.amount || 0), 0)

      setStats({
        totalCompleted: released.length,
        totalEarned,
        activeContracts: active.length,
      })

      setCompletedGigs(
        released.map((c) => ({
          id: c.id,
          amount: c.amount,
          created_at: c.created_at,
          jobs: (c.jobs as any) ?? null,
        }))
      )
    }

    setLoading(false)
  }

  function enterEditMode() {
    if (!profile) return
    setEditName(profile.name ?? '')
    setEditBio(profile.bio ?? '')
    setEditSkills(profile.skills?.join(', ') ?? '')
    setEditHourlyRate(profile.hourly_rate != null ? String(profile.hourly_rate) : '')
    setSaveError(null)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setSaveError(null)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    setSaveError(null)

    const skillsArray = editSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const updates: Record<string, any> = {
      name: editName || null,
      bio: editBio || null,
      skills: skillsArray.length > 0 ? skillsArray : null,
    }

    const rateNum = parseFloat(editHourlyRate)
    if (!isNaN(rateNum) && editHourlyRate !== '') {
      updates.hourly_rate = rateNum
    } else {
      updates.hourly_rate = null
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', profile.id)

    if (error) {
      // hourly_rate column may not exist yet — retry without it
      if (error.message?.includes('hourly_rate')) {
        const { name, bio, skills } = updates
        const { error: retryError } = await supabase
          .from('users')
          .update({ name, bio, skills })
          .eq('id', profile.id)

        if (retryError) {
          setSaveError(retryError.message)
          setSaving(false)
          return
        }
      } else {
        setSaveError(error.message)
        setSaving(false)
        return
      }
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            name: updates.name,
            bio: updates.bio,
            skills: updates.skills,
            hourly_rate: updates.hourly_rate ?? prev.hourly_rate,
          }
        : prev
    )
    setEditMode(false)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Profile not found.</p>
      </div>
    )
  }

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">
          CryptoGig
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/gigs" className="text-gray-400 hover:text-white text-sm transition-all">
            Browse Gigs
          </Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-all">
            Dashboard
          </Link>
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Profile Header Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <AvatarCircle name={profile?.name ?? null} address={paramAddress} />
            <div className="flex-1 min-w-0">
              {editMode ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full mb-2 text-xl font-bold"
                />
              ) : (
                <h1 className="text-2xl font-bold mb-1">
                  {profile?.name || 'Unnamed'}
                </h1>
              )}
              <p className="text-gray-400 text-sm font-mono mb-1">
                {shortenAddress(paramAddress)}
              </p>
              <p className="text-gray-500 text-xs">Member since {memberSince}</p>
            </div>
            {isOwner && !editMode && (
              <button
                onClick={enterEditMode}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-all flex-shrink-0"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Gigs Completed</p>
            <p className="text-white text-2xl font-bold">{stats.totalCompleted}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Total Earned</p>
            <p className="text-purple-400 text-2xl font-bold">{stats.totalEarned} USDC</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Active Contracts</p>
            <p className="text-white text-2xl font-bold">{stats.activeContracts}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Member Since</p>
            <p className="text-white text-sm font-semibold">{memberSince}</p>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">About</h2>
          </div>

          {/* Bio */}
          <div className="mb-5">
            <p className="text-gray-400 text-xs mb-2">Bio</p>
            {editMode ? (
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell clients about yourself..."
                rows={4}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full resize-none"
              />
            ) : (
              <p className="text-gray-300 leading-relaxed">
                {profile?.bio || <span className="text-gray-500 italic">No bio yet.</span>}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="mb-5">
            <p className="text-gray-400 text-xs mb-2">Skills</p>
            {editMode ? (
              <input
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="e.g. Solidity, React, TypeScript"
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full"
              />
            ) : profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-purple-900/30 text-purple-300 text-xs px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No skills listed.</p>
            )}
            {editMode && (
              <p className="text-gray-500 text-xs mt-1">Comma-separated list</p>
            )}
          </div>

          {/* Hourly Rate */}
          <div>
            <p className="text-gray-400 text-xs mb-2">Hourly Rate</p>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(e.target.value)}
                  placeholder="0"
                  type="number"
                  min="0"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-32"
                />
                <span className="text-gray-400 text-sm">USDC / hr</span>
              </div>
            ) : profile?.hourly_rate != null ? (
              <p className="text-purple-400 font-semibold">{profile.hourly_rate} USDC / hr</p>
            ) : (
              <p className="text-gray-500 italic text-sm">Not specified.</p>
            )}
          </div>

          {/* Edit actions */}
          {editMode && (
            <div className="mt-6 flex gap-3">
              {saveError && (
                <p className="text-red-400 text-sm self-center">{saveError}</p>
              )}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Portfolio */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio</h2>

          {completedGigs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No completed gigs yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {completedGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="flex justify-between items-center bg-gray-800 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {gig.jobs?.title || 'Untitled Gig'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(gig.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className="text-purple-400 font-semibold text-sm">{gig.amount} USDC</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
