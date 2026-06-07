import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { differenceInYears, parseISO } from 'date-fns'

function age(dob) {
  try { return differenceInYears(new Date(), parseISO(dob)) } catch { return '—' }
}

function photoUrl(photos) {
  const p = photos?.find((ph) => ph.is_primary) || photos?.[0]
  return p ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${p.storage_path}` : null
}

function ProfileMini({ profile, side }) {
  const photo = photoUrl(profile?.photos)
  return (
    <Link to={`/profile/${profile?.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
            {profile?.gender === 'female' ? '👩' : '👨'}
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{profile?.name}</p>
        <p className="text-gray-400 text-xs">
          {profile?.date_of_birth ? `${age(profile.date_of_birth)} yrs · ` : ''}{profile?.city || ''}
        </p>
      </div>
    </Link>
  )
}

const STATUS_BADGE = {
  pending:  'badge badge-yellow',
  accepted: 'badge badge-green',
  declined: 'badge badge-red',
}

export default function Interests() {
  const [tab, setTab] = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        api.get('/interests/received'),
        api.get('/interests/sent'),
      ])
      setReceived(r.data)
      setSent(s.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function respond(interestId, status) {
    try {
      await api.patch(`/interests/${interestId}`, { status })
      toast.success(status === 'accepted' ? 'Interest accepted! You can now message.' : 'Declined.')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not update')
    }
  }

  async function withdraw(interestId) {
    if (!confirm('Withdraw this interest?')) return
    try {
      await api.delete(`/interests/${interestId}`)
      toast.success('Interest withdrawn')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not withdraw')
    }
  }

  const pending = received.filter((i) => i.status === 'pending')
  const items = tab === 'received' ? received : sent

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-1">Interests</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'received', label: `Received ${pending.length ? `(${pending.length} new)` : ''}` },
          { key: 'sent', label: 'Sent' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">{tab === 'received' ? '💌' : '📨'}</p>
          <p className="font-semibold text-gray-700">No {tab} interests yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {tab === 'sent' ? 'Browse profiles and send interest to get started' : 'Interest received from other members will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((interest) => {
            const other = tab === 'received' ? interest.sender_profile : interest.receiver_profile
            return (
              <div key={interest.id} className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <ProfileMini profile={other} side={tab} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={STATUS_BADGE[interest.status]}>
                    {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
                  </span>

                  {tab === 'received' && interest.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => respond(interest.id, 'accepted')}
                        className="btn-primary text-xs py-1.5 px-3">Accept</button>
                      <button onClick={() => respond(interest.id, 'declined')}
                        className="btn-secondary text-xs py-1.5 px-3 text-red-600 border-red-200">Decline</button>
                    </div>
                  )}

                  {tab === 'received' && interest.status === 'accepted' && (
                    <Link to={`/messages/${other?.user_id}`} className="btn-primary text-xs py-1.5 px-3">
                      💬 Chat
                    </Link>
                  )}

                  {tab === 'sent' && interest.status === 'pending' && (
                    <button onClick={() => withdraw(interest.id)}
                      className="btn-secondary text-xs py-1.5 px-3 text-red-600 border-red-200">
                      Withdraw
                    </button>
                  )}

                  {tab === 'sent' && interest.status === 'accepted' && (
                    <Link to={`/messages/${other?.user_id}`} className="btn-primary text-xs py-1.5 px-3">
                      💬 Chat
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
