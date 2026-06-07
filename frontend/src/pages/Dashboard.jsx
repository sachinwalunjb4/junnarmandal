import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ProfileCard from '../components/ProfileCard'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [interests, setInterests] = useState({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/matches?limit=6').catch(() => ({ data: [] })),
      api.get('/interests/received').catch(() => ({ data: [] })),
      api.get('/interests/sent').catch(() => ({ data: [] })),
    ]).then(([m, ir, is_]) => {
      setMatches(m.data)
      setInterests({ received: ir.data, sent: is_.data })
    }).finally(() => setLoading(false))
  }, [])

  const pendingReceived = interests.received.filter((i) => i.status === 'pending')
  const acceptedInterests = interests.received.filter((i) => i.status === 'accepted')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Welcome banner */}
      <div className="card bg-gradient-to-r from-primary-700 to-primary-600 text-white p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Namaste, {profile?.name || user?.email?.split('@')[0]}! 🙏
          </h1>
          <p className="text-primary-200 text-sm mt-1">
            {profile ? (
              profile.is_approved
                ? 'Your profile is live and visible to other members.'
                : 'Your profile is under review. We\'ll notify you once approved.'
            ) : (
              'Complete your profile to start connecting.'
            )}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {!profile ? (
            <Link to="/profile/edit" className="btn-primary bg-white !text-primary-700 text-sm">
              Complete Profile
            </Link>
          ) : (
            <Link to="/profile/me" className="btn-secondary bg-white/20 border-white/30 !text-white text-sm">
              View Profile
            </Link>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Matches Found', value: matches.length, to: '/matches', color: 'text-primary-700' },
          { label: 'Interests Received', value: pendingReceived.length, to: '/interests', color: 'text-saffron-600' },
          { label: 'Accepted Interests', value: acceptedInterests.length, to: '/interests', color: 'text-green-600' },
          { label: 'Interests Sent', value: interests.sent.length, to: '/interests', color: 'text-blue-600' },
        ].map(({ label, value, to, color }) => (
          <Link key={label} to={to} className="card p-5 hover:shadow-md transition-shadow text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* New interests alert */}
      {pendingReceived.length > 0 && (
        <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💌</span>
            <div>
              <p className="font-semibold text-saffron-800">{pendingReceived.length} new interest{pendingReceived.length > 1 ? 's' : ''} waiting!</p>
              <p className="text-sm text-saffron-600">Review and accept or decline</p>
            </div>
          </div>
          <Link to="/interests" className="btn-primary bg-saffron-500 hover:bg-saffron-600 text-sm">View</Link>
        </div>
      )}

      {/* Profile incomplete warning */}
      {!profile && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">Your profile is incomplete</p>
              <p className="text-sm text-red-600">Add your details to appear in search results</p>
            </div>
          </div>
          <Link to="/profile/edit" className="btn-danger text-sm">Complete Now</Link>
        </div>
      )}

      {/* Top Matches */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading matches…</div>
      ) : matches.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Your Top Matches</h2>
            <Link to="/matches" className="text-primary-600 text-sm font-medium hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {matches.map(({ profile: p, score }) => (
              <ProfileCard key={p.id} profile={p} score={score} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="font-bold text-gray-700 text-lg">No matches yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">Set your partner preferences to see compatibility matches</p>
          <Link to="/profile/preferences" className="btn-primary">Set Preferences</Link>
        </div>
      )}
    </div>
  )
}
