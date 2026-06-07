import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const COMMUNITIES = [
  'Brahmin', 'Maratha', 'Mali', 'Dhangar', 'Teli', 'Chambhar', 'Mahar',
  'Buddhist (Ambedkarite)', 'Koli', 'Gujar', 'Bhandari', 'Other'
]

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function EditProfile() {
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    name: '', gender: '', date_of_birth: '', height_cm: '', marital_status: 'never_married',
    mother_tongue: 'Marathi', religion: 'Hindu', community: '', city: '', about_me: '',
    qualification: '', profession: '', annual_income: '',
    family_type: 'joint', father_occupation: '', mother_occupation: '', siblings_count: '0',
  })

  useEffect(() => {
    api.get('/profiles/me')
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name || '',
          gender: p.gender || '',
          date_of_birth: p.date_of_birth || '',
          height_cm: p.height_cm || '',
          marital_status: p.marital_status || 'never_married',
          mother_tongue: p.mother_tongue || 'Marathi',
          religion: p.religion || 'Hindu',
          community: p.community || '',
          city: p.city || '',
          about_me: p.about_me || '',
          qualification: p.qualification || '',
          profession: p.profession || '',
          annual_income: p.annual_income || '',
          family_type: p.family_type || 'joint',
          father_occupation: p.father_occupation || '',
          mother_occupation: p.mother_occupation || '',
          siblings_count: String(p.siblings_count ?? 0),
        })
      })
      .catch(() => setIsNew(true))
      .finally(() => setLoading(false))
  }, [])

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        siblings_count: Number(form.siblings_count),
      }
      if (isNew) {
        await api.post('/profiles', payload)
        toast.success('Profile created! Awaiting admin approval.')
      } else {
        await api.put('/profiles/me', payload)
        toast.success('Profile updated!')
      }
      await refreshProfile()
      navigate('/profile/me')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-1">{isNew ? 'Create Profile' : 'Edit Profile'}</h1>
      <p className="text-gray-500 text-sm mb-6">Fill in your details to appear in search results</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Gender *">
              <select className="input" required value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth *">
              <input type="date" className="input" required value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
            </Field>
            <Field label="Height (cm)">
              <input type="number" className="input" value={form.height_cm}
                onChange={(e) => set('height_cm', e.target.value)} placeholder="e.g. 165" min={100} max={250} />
            </Field>
            <Field label="Marital Status">
              <select className="input" value={form.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
                <option value="never_married">Never Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="awaiting_divorce">Awaiting Divorce</option>
              </select>
            </Field>
            <Field label="Mother Tongue">
              <input className="input" value={form.mother_tongue} onChange={(e) => set('mother_tongue', e.target.value)} />
            </Field>
            <Field label="Religion">
              <input className="input" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
            </Field>
            <Field label="Community / Caste">
              <select className="input" value={form.community} onChange={(e) => set('community', e.target.value)}>
                <option value="">Select</option>
                {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City / Village">
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Junnar, Narayangaon…" />
            </Field>
          </div>
          <Field label="About Me">
            <textarea className="input" rows={4} value={form.about_me}
              onChange={(e) => set('about_me', e.target.value)}
              placeholder="Tell others about yourself, your interests, and what you're looking for…" />
          </Field>
        </div>

        {/* Education */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Education &amp; Career</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Highest Qualification">
              <select className="input" value={form.qualification} onChange={(e) => set('qualification', e.target.value)}>
                <option value="">Select</option>
                {['10th Pass', '12th Pass', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Profession">
              <input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)}
                placeholder="e.g. Engineer, Farmer, Teacher…" />
            </Field>
            <Field label="Annual Income">
              <select className="input" value={form.annual_income} onChange={(e) => set('annual_income', e.target.value)}>
                <option value="">Prefer not to say</option>
                {['Below ₹2 Lakh', '₹2–5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', 'Above ₹20 Lakh'].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Family */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Family Background</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Family Type">
              <select className="input" value={form.family_type} onChange={(e) => set('family_type', e.target.value)}>
                <option value="joint">Joint Family</option>
                <option value="nuclear">Nuclear Family</option>
                <option value="extended">Extended Family</option>
              </select>
            </Field>
            <Field label="Number of Siblings">
              <input type="number" className="input" value={form.siblings_count}
                onChange={(e) => set('siblings_count', e.target.value)} min={0} max={20} />
            </Field>
            <Field label="Father's Occupation">
              <input className="input" value={form.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} />
            </Field>
            <Field label="Mother's Occupation">
              <input className="input" value={form.mother_occupation} onChange={(e) => set('mother_occupation', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : isNew ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
