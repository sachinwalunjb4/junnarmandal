import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ProfileCard from '../components/ProfileCard'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches?limit=30')
      .then((res) => setMatches(res.data))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Your Matches</h1>
          <p className="text-gray-500 text-sm">Ranked by compatibility with your preferences</p>
        </div>
        <Link to="/profile/preferences" className="btn-secondary text-sm">Edit Preferences</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">💡</p>
          <h3 className="font-bold text-gray-700 text-lg">No matches yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6 max-w-sm mx-auto">
            Set your partner preferences to see compatibility suggestions tailored to you
          </p>
          <Link to="/profile/preferences" className="btn-primary">Set Preferences</Link>
        </div>
      ) : (
        <>
          {/* Score legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { range: '80–100%', label: 'Excellent match', color: 'bg-green-100 text-green-700' },
              { range: '60–79%',  label: 'Good match',      color: 'bg-blue-100 text-blue-700' },
              { range: '40–59%',  label: 'Fair match',      color: 'bg-yellow-100 text-yellow-700' },
            ].map(({ range, label, color }) => (
              <span key={range} className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
                {range} – {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {matches.map(({ profile, score, score_breakdown }) => (
              <div key={profile.id} className="group">
                <ProfileCard profile={profile} score={score} />
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block mt-1 card p-3 text-xs text-gray-600 space-y-1">
                  {Object.entries(score_breakdown).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize">{k}</span>
                      <span className="font-medium text-primary-700">{v}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
