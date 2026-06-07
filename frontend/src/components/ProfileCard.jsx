import { Link } from 'react-router-dom'
import { differenceInYears, parseISO } from 'date-fns'
import api from '../services/api'
import { useState } from 'react'
import toast from 'react-hot-toast'

function age(dob) {
  try { return differenceInYears(new Date(), parseISO(dob)) } catch { return '—' }
}

function primaryPhoto(photos) {
  const p = photos?.find((ph) => ph.is_primary) || photos?.[0]
  return p ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${p.storage_path}` : null
}

export default function ProfileCard({ profile, onInterestSent, score }) {
  const [sending, setSending] = useState(false)
  const [shortlisting, setShortlisting] = useState(false)
  const photoUrl = primaryPhoto(profile.photos)

  async function sendInterest() {
    setSending(true)
    try {
      await api.post('/interests', { receiver_id: profile.user_id })
      toast.success('Interest sent!')
      onInterestSent?.()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not send interest')
    } finally {
      setSending(false)
    }
  }

  async function addShortlist() {
    setShortlisting(true)
    try {
      await api.post('/shortlists', { target_id: profile.user_id })
      toast.success('Added to shortlist!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not shortlist')
    } finally {
      setShortlisting(false)
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Photo */}
      <Link to={`/profile/${profile.user_id}`} className="block relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
            {profile.gender === 'female' ? '👩' : '👨'}
          </div>
        )}
        {score !== undefined && (
          <div className="absolute top-2 right-2 bg-primary-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {score}% match
          </div>
        )}
        {!profile.is_approved && (
          <div className="absolute top-2 left-2 badge badge-yellow">Pending</div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/profile/${profile.user_id}`} className="block">
          <h3 className="font-bold text-gray-800 text-base truncate hover:text-primary-700">{profile.name}</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            {age(profile.date_of_birth)} yrs
            {profile.height_cm && ` · ${Math.floor(profile.height_cm / 30.48)}'${Math.round((profile.height_cm % 30.48) / 2.54)}"`}
          </p>
          <p className="text-gray-500 text-sm truncate">
            {[profile.qualification, profile.profession].filter(Boolean).join(' · ')}
          </p>
          <p className="text-gray-400 text-xs mt-1">{profile.city || '—'}</p>
        </Link>

        <div className="flex gap-2 mt-3">
          <button
            onClick={sendInterest}
            disabled={sending}
            className="btn-primary flex-1 text-xs py-2"
          >
            {sending ? '…' : '💌 Interest'}
          </button>
          <button
            onClick={addShortlist}
            disabled={shortlisting}
            className="btn-secondary px-3 py-2 text-base"
            title="Shortlist"
          >
            ♡
          </button>
        </div>
      </div>
    </div>
  )
}
