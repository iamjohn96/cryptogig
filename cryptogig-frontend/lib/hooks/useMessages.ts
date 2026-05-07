// lib/hooks/useMessages.ts
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../supabase'

export interface Channel {
  id: string
  gig_id: string | null
  client_address: string
  freelancer_address: string
  created_at: string
  updated_at: string
  gig?: { title: string }
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  channel_id: string
  sender_address: string
  content: string
  read_at: string | null
  created_at: string
}

// ─── 채널 목록 ───────────────────────────────────────────────
export function useChannels(walletAddress: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChannels = useCallback(async () => {
    if (!walletAddress) return
    const addr = walletAddress.toLowerCase()

    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        gig:gig_id ( title )
      `)
      .or(`client_address.eq.${addr},freelancer_address.eq.${addr}`)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      // 각 채널의 마지막 메시지 조회
      const enriched = await Promise.all(
        data.map(async (ch) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('channel_id', ch.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', ch.id)
            .neq('sender_address', addr)
            .is('read_at', null)

          return {
            ...ch,
            last_message: msgs?.[0] ?? null,
            unread_count: count ?? 0,
          }
        })
      )
      setChannels(enriched)
    }
    setLoading(false)
  }, [walletAddress])

  useEffect(() => {
    fetchChannels()

    // 새 메시지 오면 채널 목록 갱신
    const sub = supabase
      .channel('channels-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, fetchChannels)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchChannels)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [fetchChannels])

  return { channels, loading, refetch: fetchChannels }
}

// ─── 채널 생성 or 기존 채널 반환 ─────────────────────────────
export async function getOrCreateChannel(
  gigId: string | null,
  clientAddress: string,
  freelancerAddress: string
): Promise<string | null> {
  const client = clientAddress.toLowerCase()
  const freelancer = freelancerAddress.toLowerCase()

  // 기존 채널 확인
  const query = supabase
    .from('channels')
    .select('id')
    .eq('client_address', client)
    .eq('freelancer_address', freelancer)

  if (gigId) query.eq('gig_id', gigId)

  const { data: existing } = await query.single()
  if (existing) return existing.id

  // 신규 생성
  const { data, error } = await supabase
    .from('channels')
    .insert({ gig_id: gigId, client_address: client, freelancer_address: freelancer })
    .select('id')
    .single()

  if (error) { console.error('Channel create error:', error); return null }
  return data.id
}

// ─── 메시지 목록 + Realtime ──────────────────────────────────
export function useMessages(channelId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!channelId) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (!error && data) setMessages(data)
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    fetchMessages()

    const sub = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channelId, fetchMessages])

  const sendMessage = useCallback(async (senderAddress: string, content: string) => {
    if (!channelId || !content.trim()) return
    await supabase.from('messages').insert({
      channel_id: channelId,
      sender_address: senderAddress.toLowerCase(),
      content: content.trim(),
    })
  }, [channelId])

  const markAsRead = useCallback(async (readerAddress: string) => {
    if (!channelId) return
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .neq('sender_address', readerAddress.toLowerCase())
      .is('read_at', null)
  }, [channelId])

  return { messages, loading, sendMessage, markAsRead, bottomRef }
}
