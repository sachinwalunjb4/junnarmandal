import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const MARITAL_OPTIONS = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
]

export default function Preferences() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    min_age: 18, max_age: 35,
    min_height_cm: '', max_height_cm: '',
    religion: '', community: '',
    education: '', location: '',
    marital_status: [],
  })

  useEffect(() => {
    api.get('/profiles/me/preferences')
      .then((res) => {
        const p = res.data
        setForm({
          min_age: p.min_age ?? 18,
          max_age: p.max_age ?? 35,
          min_height_cm: p.min_height_cm || '',
          max_height_cm: p.max_height_cm || '',
          religion: p.religion || '',
          community: p.community || '',
          education: p.education || '',
          location: p.location || '',
          marital_status: p.marital_status || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  function toggleMarital(val) {
    setForm((f) => ({
      ...f,
      marital_status: f.marital_status.includes(val)
        ? f.marital_status.filter((v) => v !== val)
        : [...f.marital_status, val],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        min_height_cm: form.min_height_cm ? Number(form.min_height_cm) : null,
        max_height_cm: form.max_height_cm ? Number(form.max_height_cm) : null,
        marital_status: form.marital_status.length ? form.marital_status : null,
      }
      await api.post('/profiles/me/preferences', payload)
      toast.success('Preferences saved!')
      navigate('/matches')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-1">Partner Preferences</h1>
      <p className="text-gray-500 text-sm mb-6">Tell us what you're looking for to get better match suggestions</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          {/* Age */}
          <div>
            <label className="label">Age Range</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input type="number" className="input text-center" value={form.min_age} min={18} max={80}
                  onChange={(e) => set('min_age', Number(e.target.value))} />
                <p className="text-xs text-gray-400 text-center mt-1">Min</p>
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex-1">
                <input type="number" className="input text-center" value={form.max_age} min={18} max={80}
                  onChange={(e) => set('max_age', Number(e.target.value))} />
                <p className="text-xs text-gray-400 text-center mt-1">Max</p>
              </div>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="label">Height Range (cm) <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex items-center gap-4">
              <input type="number" className="input text-center" value={form.min_height_cm} min={100} max={250}
                onChange={(e) => set('min_height_cm', e.target.value)} placeholder="Min" />
              <span className="text-gray-400">to</span>
              <input type="number" className="input text-center" value={form.max_height_cm} min={100} max={250}
                onChange={(e) => set('max_height_cm', e.target.value)} placeholder="Max" />
            </div>
          </div>

          {/* Religion & Community */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Religion</label>
              <input className="input" value={form.religion} onChange={(e) => set('religion', e.target.value)}
                placeholder="Any" />
            </div>
            <div>
              <label className="label">Community / Caste</label>
              <input className="input" value={form.community} onChange={(e) => set('community', e.target.value)}
                placeholder="Any" />
            </div>
          </div>

          {/* Education & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Education</label>
              <select className="input" value={form.education} onChange={(e) => set('education', e.target.value)}>
                <option value="">Any</option>
                {["Bachelor's Degree", "Master's Degree", 'PhD', 'Diploma'].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preferred Location</label>
              <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Junnar" />
            </div>
          </div>

          {/* Marital status */}
          <div>
            <label className="label">Acceptable Marital Status</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MARITAL_OPTIONS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleMarital(value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.marital_status.includes(value)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  )
}
