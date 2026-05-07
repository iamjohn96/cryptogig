// app/messages/[channelId]/page.tsx
'use client'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useMessages } from '@/lib/hooks/useMessages'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function groupByDate(messages: any[]) {
  const groups: { date: string; messages: any[] }[] = []
  messages.forEach((msg) => {
    const d = new Date(msg.created_at)
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy')
    const last = groups[groups.length - 1]
    if (last?.date === label) last.messages.push(msg)
    else groups.push({ date: label, messages: [msg] })
  })
  return groups
}

export default function ChatPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const { address } = useAccount()
  const router = useRouter()
  const { messages, loading, sendMessage, markAsRead, bottomRef } = useMessages(channelId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [channel, setChannel] = useState<any>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 채널 메타 정보
  useEffect(() => {
    supabase
      .from('channels')
      .select('*, gig:gig_id(id, title)')
      .eq('id', channelId)
      .single()
      .then(({ data }) => setChannel(data))
  }, [channelId])

  // 입장 시 읽음 처리
  useEffect(() => {
    if (address) markAsRead(address)
  }, [address, markAsRead, messages.length])

  // 최초 스크롤
  useEffect(() => {
    if (!loading) {
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
    }
  }, [loading])

  const handleSend = async () => {
    if (!address || !input.trim() || sending) return
    setSending(true)
    await sendMessage(address, input)
    setInput('')
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const myAddr = address?.toLowerCase() ?? ''
  const otherAddr = channel
    ? channel.client_address === myAddr
      ? channel.freelancer_address
      : channel.client_address
    : ''

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-950">
        <button onClick={() => router.push('/messages')} className="text-gray-400 hover:text-white transition-colors">
          ←
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
          {otherAddr.slice(2, 4).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">
            <Link href={`/profile/${otherAddr}`} className="hover:text-purple-400 transition-colors">
              {shortAddr(otherAddr)}
            </Link>
          </p>
          {channel?.gig && (
            <Link href={`/gigs/${channel.gig.id}`} className="text-xs text-purple-400 hover:underline truncate block">
              re: {channel.gig.title}
            </Link>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-950">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 pt-16">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          groupByDate(messages).map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-500">{group.date}</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <div className="space-y-1">
                {group.messages.map((msg, i) => {
                  const isMe = msg.sender_address === myAddr
                  const prevMsg = group.messages[i - 1]
                  const isSamesender = prevMsg?.sender_address === msg.sender_address
                  const showTime = !group.messages[i + 1] ||
                    group.messages[i + 1].sender_address !== msg.sender_address

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSamesender ? 'mt-0.5' : 'mt-3'}`}>
                      {/* Other avatar */}
                      {!isMe && !isSamesender && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                          {msg.sender_address.slice(2, 4).toUpperCase()}
                        </div>
                      )}
                      {!isMe && isSamesender && <div className="w-9 flex-shrink-0" />}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap
                            ${isMe
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                            }
                            ${isSamesender && isMe ? 'rounded-tr-2xl' : ''}
                            ${isSamesender && !isMe ? 'rounded-tl-2xl' : ''}
                          `}
                        >
                          {msg.content}
                        </div>
                        {showTime && (
                          <span className="text-xs text-gray-600 mt-0.5 px-1">
                            {format(new Date(msg.created_at), 'h:mm a')}
                            {isMe && msg.read_at && <span className="ml-1 text-purple-400">✓✓</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-950">
        {!address ? (
          <p className="text-center text-gray-500 text-sm py-2">Connect wallet to send messages</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
