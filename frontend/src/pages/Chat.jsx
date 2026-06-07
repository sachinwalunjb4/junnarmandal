import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

function photoUrl(path) {
  return path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`
    : null
}

export default function Chat() {
  const { partnerId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [partner, setPartner] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()
  const pollRef = useRef()

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${partnerId}`)
      setMessages(res.data)
    } catch {
      // handled below
    }
  }, [partnerId])

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        // Load partner profile
        const profileRes = await api.get(`/profiles/${partnerId}`)
        setPartner(profileRes.data)
        await loadMessages()
      } catch {
        toast.error('Could not load conversation')
      } finally {
        setLoading(false)
      }
    }
    init()

    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(loadMessages, 5000)
    return () => clearInterval(pollRef.current)
  }, [partnerId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await api.post('/messages', { receiver_id: partnerId, body: text.trim() })
      setMessages((prev) => [...prev, res.data])
      setText('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  const partnerPhoto = partner?.photos?.find((p) => p.is_primary) || partner?.photos?.[0]

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
    </div>
  )

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = format(parseISO(msg.created_at), 'PPP')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(msg)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/messages" className="text-primary-600 text-sm hover:underline mr-1">←</Link>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
          {partnerPhoto ? (
            <img src={photoUrl(partnerPhoto.storage_path)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">👤</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${partnerId}`} className="font-semibold text-gray-800 hover:text-primary-700 truncate block">
            {partner?.name}
          </Link>
          <p className="text-xs text-gray-400">{partner?.city}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center mb-3">
              <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">{date}</span>
            </div>
            <div className="space-y-2">
              {msgs.map((msg) => {
                const isMine = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                        {format(parseISO(msg.created_at), 'p')}
                        {isMine && msg.is_read && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">Say hello to {partner?.name}!</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <input
          className="input flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          maxLength={2000}
          autoFocus
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary shrink-0 px-5">
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
