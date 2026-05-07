// app/messages/page.tsx
'use client'
import { useAccount } from 'wagmi'
import { useChannels } from '@/lib/hooks/useMessages'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function MessagesPage() {
  const { address } = useAccount()
  const { channels, loading } = useChannels(address)

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Connect your wallet to view messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">💬</p>
          <p>No conversations yet.</p>
          <Link href="/gigs" className="text-purple-400 hover:underline mt-2 inline-block">
            Browse gigs to get started
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => {
            const isClient = ch.client_address === address?.toLowerCase()
            const otherAddr = isClient ? ch.freelancer_address : ch.client_address
            const hasUnread = (ch.unread_count ?? 0) > 0

            return (
              <Link
                key={ch.id}
                href={`/messages/${ch.id}`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
                  ${hasUnread
                    ? 'bg-purple-900/20 border-purple-500/40 hover:bg-purple-900/30'
                    : 'bg-gray-900 border-gray-700/50 hover:bg-gray-800'
                  }`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {otherAddr.slice(2, 4).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-white text-sm">
                      {shortAddr(otherAddr)}
                    </span>
                    {ch.last_message && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(ch.last_message.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {ch.gig?.title && (
                    <p className="text-xs text-purple-400 truncate mb-0.5">
                      re: {ch.gig.title}
                    </p>
                  )}

                  <p className="text-sm text-gray-400 truncate">
                    {ch.last_message?.content ?? 'No messages yet'}
                  </p>
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <span className="bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {ch.unread_count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
