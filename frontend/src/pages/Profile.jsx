import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { differenceInYears, parseISO } from 'date-fns'

function age(dob) {
  try { return differenceInYears(new Date(), parseISO(dob)) } catch { return '—' }
}

function photoUrl(path) {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`
}

const INFO_ROW = ({ label, value }) =>
  value ? (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-gray-800 font-medium">{value}</dd>
    </div>
  ) : null

export default function Profile() {
  const { userId } = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const isMe = !userId || userId === user?.id

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interestStatus, setInterestStatus] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const url = isMe ? '/profiles/me' : `/profiles/${userId}`
        const res = await api.get(url)
        setProfile(res.data)

        if (!isMe) {
          // Check existing interest
          const sentRes = await api.get('/interests/sent').catch(() => ({ data: [] }))
          const existing = sentRes.data.find((i) => i.receiver_id === userId)
          setInterestStatus(existing?.status || null)
        }
      } catch {
        toast.error('Profile not found')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, isMe])

  async function sendInterest() {
    try {
      await api.post('/interests', { receiver_id: userId })
      setInterestStatus('pending')
      toast.success('Interest sent!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not send interest')
    }
  }

  async function blockUser() {
    if (!confirm('Block this user? They will not be able to see your profile.')) return
    setBlocking(true)
    try {
      await api.post('/blocks', { blocked_id: userId })
      toast.success('User blocked')
      navigate('/search')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not block')
    } finally {
      setBlocking(false)
    }
  }

  async function reportUser() {
    const reason = prompt('Reason for reporting this profile:')
    if (!reason?.trim()) return
    try {
      await api.post('/reports', { reported_id: userId, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch {
      toast.error('Could not submit report')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const photos = profile.photos || []
  const publicPhotos = isMe ? photos : photos.filter((p) => p.is_public)

  const heightFt = profile.height_cm
    ? `${Math.floor(profile.height_cm / 30.48)}'${Math.round((profile.height_cm % 30.48) / 2.54)}"`
    : null

  const maritalLabels = {
    never_married: 'Never Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
    awaiting_divorce: 'Awaiting Divorce',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {/* Back */}
      {!isMe && (
        <button onClick={() => navigate(-1)} className="text-primary-600 text-sm mb-4 hover:underline flex items-center gap-1">
          ← Back
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Photos */}
        <div className="space-y-3">
          <div className="card overflow-hidden aspect-square">
            {publicPhotos.length > 0 ? (
              <img
                src={photoUrl(publicPhotos[activePhoto]?.storage_path)}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-50 text-gray-200">
                {profile.gender === 'female' ? '👩' : '👨'}
              </div>
            )}
          </div>
          {publicPhotos.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {publicPhotos.map((ph, i) => (
                <button
                  key={ph.id}
                  onClick={() => setActivePhoto(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-primary-500' : 'border-transparent'}`}
                >
                  <img src={photoUrl(ph.storage_path)} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {!isMe && (
            <div className="space-y-2">
              {interestStatus === null && (
                <button onClick={sendInterest} className="btn-primary w-full">
                  💌 Send Interest
                </button>
              )}
              {interestStatus === 'pending' && (
                <div className="text-center py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm font-medium">
                  ⏳ Interest sent – awaiting response
                </div>
              )}
              {interestStatus === 'accepted' && (
                <Link to={`/messages/${userId}`} className="btn-primary w-full text-center block">
                  💬 Message
                </Link>
              )}
              {interestStatus === 'declined' && (
                <div className="text-center py-2 px-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  Interest declined
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={blockUser}
                  disabled={blocking}
                  className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                  Block
                </button>
                <button onClick={reportUser} className="btn-secondary flex-1 text-sm">
                  Report
                </button>
              </div>
            </div>
          )}

          {isMe && (
            <div className="space-y-2">
              <Link to="/profile/edit" className="btn-primary w-full text-center block">Edit Profile</Link>
              <Link to="/profile/photos" className="btn-secondary w-full text-center block">Manage Photos</Link>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{profile.name}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {age(profile.date_of_birth)} yrs · {profile.city || 'Junnar'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge badge-pink">{profile.religion}</span>
                  {profile.community && <span className="badge badge-gray">{profile.community}</span>}
                  <span className="badge badge-gray">{maritalLabels[profile.marital_status]}</span>
                  {!profile.is_approved && <span className="badge badge-yellow">Pending Approval</span>}
                </div>
              </div>
            </div>
            {profile.about_me && (
              <p className="mt-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{profile.about_me}</p>
            )}
          </div>

          {/* Personal */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-700 mb-3">Personal Details</h2>
            <dl>
              <INFO_ROW label="Date of Birth" value={profile.date_of_birth} />
              <INFO_ROW label="Height" value={heightFt} />
              <INFO_ROW label="Marital Status" value={maritalLabels[profile.marital_status]} />
              <INFO_ROW label="Mother Tongue" value={profile.mother_tongue} />
              <INFO_ROW label="Religion" value={profile.religion} />
              <INFO_ROW label="Community" value={profile.community} />
              <INFO_ROW label="City / Village" value={profile.city} />
            </dl>
          </div>

          {/* Education & Career */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-700 mb-3">Education &amp; Career</h2>
            <dl>
              <INFO_ROW label="Qualification" value={profile.qualification} />
              <INFO_ROW label="Profession" value={profile.profession} />
              <INFO_ROW label="Annual Income" value={profile.annual_income} />
            </dl>
          </div>

          {/* Family */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-700 mb-3">Family Background</h2>
            <dl>
              <INFO_ROW label="Family Type" value={profile.family_type ? profile.family_type.charAt(0).toUpperCase() + profile.family_type.slice(1) : null} />
              <INFO_ROW label="Father's Occupation" value={profile.father_occupation} />
              <INFO_ROW label="Mother's Occupation" value={profile.mother_occupation} />
              <INFO_ROW label="Siblings" value={profile.siblings_count !== null ? String(profile.siblings_count) : null} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
