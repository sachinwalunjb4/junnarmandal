import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { differenceInYears, parseISO } from 'date-fns'

function age(dob) {
  try { return differenceInYears(new Date(), parseISO(dob)) } catch { return '—' }
}

function photoUrl(photos) {
  const p = photos?.find((ph) => ph.is_primary) || photos?.[0]
  return p ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${p.storage_path}` : null
}

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/admin/profiles/pending')
      setProfiles(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function approve(userId, isApproved) {
    try {
      await api.patch(`/admin/profiles/${userId}/approve`, { is_approved: isApproved })
      toast.success(isApproved ? 'Profile approved and live!' : 'Profile rejected')
      load()
    } catch {
      toast.error('Action failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-primary-600 text-sm hover:underline">← Admin</Link>
          <h1 className="section-title mt-1">Pending Profile Approvals</h1>
          <p className="text-gray-500 text-sm">{profiles.length} profile{profiles.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-3">✅</p>
          <h3 className="font-bold text-gray-700">All profiles reviewed!</h3>
          <p className="text-gray-400 text-sm mt-1">No pending approvals at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const photo = photoUrl(profile.photos)
            return (
              <div key={profile.id} className="card overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">
                      {profile.gender === 'female' ? '👩' : '👨'}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <Link to={`/profile/${profile.user_id}`} className="font-bold text-gray-800 hover:text-primary-700">
                    {profile.name}
                  </Link>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {age(profile.date_of_birth)} yrs · {profile.gender} · {profile.city || 'Unknown city'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{profile.religion} · {profile.community || 'N/A'}</p>
                  <p className="text-gray-400 text-xs">{profile.qualification} · {profile.profession || '—'}</p>
                  {profile.about_me && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">{profile.about_me}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => approve(profile.user_id, true)}
                      className="btn-primary flex-1 text-xs py-2"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => approve(profile.user_id, false)}
                      className="btn-danger flex-1 text-xs py-2"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
