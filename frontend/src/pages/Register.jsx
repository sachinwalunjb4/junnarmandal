import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const STEPS = ['Account', 'Personal', 'Education & Career', 'Family']

const COMMUNITIES = [
  'Brahmin', 'Maratha', 'Mali', 'Dhangar', 'Teli', 'Chambhar', 'Mahar',
  'Buddhist (Ambedkarite)', 'Koli', 'Gujar', 'Bhandari', 'Other'
]

export default function Register() {
  const { signup, login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', gender: '', date_of_birth: '', height_cm: '', marital_status: 'never_married',
    mother_tongue: 'Marathi', religion: 'Hindu', community: '', city: '', about_me: '',
    qualification: '', profession: '', annual_income: '',
    family_type: 'joint', father_occupation: '', mother_occupation: '', siblings_count: '0',
  })

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleFinish() {
    setLoading(true)
    try {
      await signup(form.email, form.password, form.name)
      toast.success('Account created! Please verify your email, then log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function nextStep(e) {
    e.preventDefault()
    if (step === 0 && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleFinish()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-saffron-50">
      <div className="card w-full max-w-lg p-8 page-enter">
        <div className="text-center mb-6">
          <span className="text-4xl">🪷</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Create Your Profile</h1>
          <p className="text-gray-500 text-sm">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form onSubmit={nextStep} className="space-y-4">
          {/* Step 0 – Account */}
          {step === 0 && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Your full name" />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="your@email.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Min 8 characters" minLength={8} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required placeholder="Repeat password" />
              </div>
            </>
          )}

          {/* Step 1 – Personal */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)} required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Marital Status</label>
                  <select className="input" value={form.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
                    <option value="never_married">Never Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="awaiting_divorce">Awaiting Divorce</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} required max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">Height (cm)</label>
                  <input type="number" className="input" value={form.height_cm} onChange={(e) => set('height_cm', e.target.value)} placeholder="e.g. 165" min={100} max={250} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Religion</label>
                  <input className="input" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
                </div>
                <div>
                  <label className="label">Community / Caste</label>
                  <select className="input" value={form.community} onChange={(e) => set('community', e.target.value)}>
                    <option value="">Select</option>
                    {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">City / Village</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Junnar, Narayangaon…" />
              </div>
              <div>
                <label className="label">About Me</label>
                <textarea className="input" rows={3} value={form.about_me} onChange={(e) => set('about_me', e.target.value)} placeholder="Write a brief introduction…" />
              </div>
            </>
          )}

          {/* Step 2 – Education & Career */}
          {step === 2 && (
            <>
              <div>
                <label className="label">Highest Qualification</label>
                <select className="input" value={form.qualification} onChange={(e) => set('qualification', e.target.value)}>
                  <option value="">Select</option>
                  {['10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Profession / Occupation</label>
                <input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)} placeholder="e.g. Software Engineer, Farmer…" />
              </div>
              <div>
                <label className="label">Annual Income</label>
                <select className="input" value={form.annual_income} onChange={(e) => set('annual_income', e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {['Below ₹2 Lakh', '₹2–5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', 'Above ₹20 Lakh'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Step 3 – Family */}
          {step === 3 && (
            <>
              <div>
                <label className="label">Family Type</label>
                <select className="input" value={form.family_type} onChange={(e) => set('family_type', e.target.value)}>
                  <option value="joint">Joint Family</option>
                  <option value="nuclear">Nuclear Family</option>
                  <option value="extended">Extended Family</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Father's Occupation</label>
                  <input className="input" value={form.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} />
                </div>
                <div>
                  <label className="label">Mother's Occupation</label>
                  <input className="input" value={form.mother_occupation} onChange={(e) => set('mother_occupation', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Number of Siblings</label>
                <input type="number" className="input" value={form.siblings_count} onChange={(e) => set('siblings_count', e.target.value)} min={0} max={20} />
              </div>
              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                After registration, please verify your email. Your profile will be reviewed by our team before it goes live.
              </p>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">
                Back
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating…' : step < STEPS.length - 1 ? 'Continue' : 'Create Profile'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
