import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDistanceToNow, parseISO } from 'date-fns'

function photoUrl(path) {
  return path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`
    : null
}

export default function Messages() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/messages/conversations')
      .then((res) => setConversations(res.data))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-6">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-3">💬</p>
          <h3 className="font-bold text-gray-700">No conversations yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            Messaging is available after both parties accept each other's interest
          </p>
          <Link to="/interests" className="btn-primary">View Interests</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const photo = photoUrl(conv.primary_photo)
            return (
              <Link
                key={conv.partner_id}
                to={`/messages/${conv.partner_id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 relative">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">👤</div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm truncate ${conv.unread_count ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conv.partner_name}
                    </p>
                    <span className="text-gray-400 text-xs shrink-0">
                      {formatDistanceToNow(parseISO(conv.last_message_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${conv.unread_count ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {conv.last_message}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
