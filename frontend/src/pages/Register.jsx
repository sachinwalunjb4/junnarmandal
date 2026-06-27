import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import toast from 'react-hot-toast'

const COMMUNITIES = [
  'Brahmin', 'Maratha', 'Mali', 'Dhangar', 'Teli', 'Chambhar', 'Mahar',
  'Buddhist (Ambedkarite)', 'Koli', 'Gujar', 'Bhandari', 'Other'
]

const DEBUG_DATA = {
  email: 'test@example.com',
  password: 'Test@1234',
  confirmPassword: 'Test@1234',
  name: 'Ramesh Patil',
  gender: 'male',
  date_of_birth: '1995-06-15',
  height_cm: '170',
  marital_status: 'never_married',
  mother_tongue: 'Marathi',
  religion: 'Hindu',
  community: 'Maratha',
  city: 'Junnar',
  about_me: 'मी जुन्नर येथील एक सॉफ्टवेअर अभियंता आहे. मला वाचन आणि प्रवास आवडतो.',
  qualification: "Bachelor's Degree",
  profession: 'Software Engineer',
  annual_income: '₹5–10 Lakh',
  family_type: 'joint',
  father_occupation: 'Farmer',
  mother_occupation: 'Homemaker',
  siblings_count: '2',
  contact_name: 'Suresh Patil',
  contact_type: 'father',
  contact_mobile: '9876543210',
}

const EMPTY_FORM = {
  email: '', password: '', confirmPassword: '',
  name: '', gender: '', date_of_birth: '', height_cm: '', marital_status: 'never_married',
  mother_tongue: 'Marathi', religion: 'Hindu', community: '', city: '', about_me: '',
  qualification: '', profession: '', annual_income: '',
  family_type: 'joint', father_occupation: '', mother_occupation: '', siblings_count: '0',
  contact_name: '', contact_type: 'father', contact_mobile: '',
}

export default function Register() {
  const { signup } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (searchParams.get('debug') === '1') {
      setForm(DEBUG_DATA)
    }
  }, [])

  const STEPS = [
    t('register', 'stepAccount'),
    t('register', 'stepPersonal'),
    t('register', 'stepEducation'),
    t('register', 'stepFamily'),
  ]

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleFinish() {
    setLoading(true)
    try {
      await signup(form.email, form.password, form.name)
      toast.success(t('register', 'emailVerifyNote'))
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

  const qualifications = t('register', 'qualifications')
  const incomes = t('register', 'incomes')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-saffron-50">
      <div className="card w-full max-w-lg p-8 page-enter">
        <div className="text-center mb-6">
          <span className="text-4xl">🪷</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">{t('register', 'title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('register', 'stepLabel')} {step + 1} {t('register', 'stepOf')} {STEPS.length}: {STEPS[step]}
          </p>
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
                <label className="label">{t('register', 'fullName')}</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder={t('register', 'fullNamePlaceholder')} />
              </div>
              <div>
                <label className="label">{t('register', 'email')}</label>
                <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder={t('register', 'emailPlaceholder')} />
              </div>
              <div>
                <label className="label">{t('register', 'password')}</label>
                <input type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder={t('register', 'passwordPlaceholder')} minLength={8} />
              </div>
              <div>
                <label className="label">{t('register', 'confirmPassword')}</label>
                <input type="password" className="input" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required placeholder={t('register', 'confirmPasswordPlaceholder')} />
              </div>
            </>
          )}

          {/* Step 1 – Personal */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('register', 'gender')}</label>
                  <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)} required>
                    <option value="">{t('register', 'selectGender')}</option>
                    <option value="male">{t('register', 'male')}</option>
                    <option value="female">{t('register', 'female')}</option>
                    <option value="other">{t('common', 'other')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('register', 'maritalStatus')}</label>
                  <select className="input" value={form.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
                    <option value="never_married">{t('register', 'neverMarried')}</option>
                    <option value="divorced">{t('register', 'divorced')}</option>
                    <option value="widowed">{t('register', 'widowed')}</option>
                    <option value="awaiting_divorce">{t('register', 'awaitingDivorce')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('register', 'dateOfBirth')}</label>
                  <input type="date" className="input" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} required max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">{t('register', 'height')}</label>
                  <input type="number" className="input" value={form.height_cm} onChange={(e) => set('height_cm', e.target.value)} placeholder={t('register', 'heightPlaceholder')} min={100} max={250} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('register', 'religion')}</label>
                  <input className="input" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
                </div>
                <div>
                  <label className="label">{t('register', 'community')}</label>
                  <select className="input" value={form.community} onChange={(e) => set('community', e.target.value)}>
                    <option value="">{t('common', 'select')}</option>
                    {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">{t('register', 'city')}</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder={t('register', 'cityPlaceholder')} />
              </div>
              <div>
                <label className="label">{t('register', 'aboutMe')}</label>
                <textarea className="input" rows={3} value={form.about_me} onChange={(e) => set('about_me', e.target.value)} placeholder={t('register', 'aboutMePlaceholder')} />
              </div>
            </>
          )}

          {/* Step 2 – Education & Career */}
          {step === 2 && (
            <>
              <div>
                <label className="label">{t('register', 'qualification')}</label>
                <select className="input" value={form.qualification} onChange={(e) => set('qualification', e.target.value)}>
                  <option value="">{t('common', 'select')}</option>
                  {qualifications.map((q, i) => (
                    <option key={i} value={['10th Pass', '12th Pass', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'][i]}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('register', 'profession')}</label>
                <input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)} placeholder={t('register', 'professionPlaceholder')} />
              </div>
              <div>
                <label className="label">{t('register', 'annualIncome')}</label>
                <select className="input" value={form.annual_income} onChange={(e) => set('annual_income', e.target.value)}>
                  <option value="">{t('common', 'preferNotToSay')}</option>
                  {incomes.map((inc, i) => (
                    <option key={i} value={['Below ₹2 Lakh', '₹2–5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', 'Above ₹20 Lakh'][i]}>{inc}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Step 3 – Family */}
          {step === 3 && (
            <>
              <div>
                <label className="label">{t('register', 'familyType')}</label>
                <select className="input" value={form.family_type} onChange={(e) => set('family_type', e.target.value)}>
                  <option value="joint">{t('register', 'joint')}</option>
                  <option value="nuclear">{t('register', 'nuclear')}</option>
                  <option value="extended">{t('register', 'extended')}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('register', 'fatherOccupation')}</label>
                  <input className="input" value={form.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} />
                </div>
                <div>
                  <label className="label">{t('register', 'motherOccupation')}</label>
                  <input className="input" value={form.mother_occupation} onChange={(e) => set('mother_occupation', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">{t('register', 'siblings')}</label>
                <input type="number" className="input" value={form.siblings_count} onChange={(e) => set('siblings_count', e.target.value)} min={0} max={20} />
              </div>

              {/* Contact for communication */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">{t('register', 'contactSection')}</p>
                <div>
                  <label className="label">{t('register', 'contactName')}</label>
                  <input className="input" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder={t('register', 'contactNamePlaceholder')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('register', 'relation')}</label>
                    <select className="input" value={form.contact_type} onChange={(e) => set('contact_type', e.target.value)}>
                      <option value="father">{t('register', 'father')}</option>
                      <option value="mother">{t('register', 'mother')}</option>
                      <option value="brother">{t('register', 'brother')}</option>
                      <option value="uncle">{t('register', 'uncle')}</option>
                      <option value="aunt">{t('register', 'aunt')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('register', 'mobile')}</label>
                    <input type="tel" className="input" value={form.contact_mobile} onChange={(e) => set('contact_mobile', e.target.value)} placeholder={t('register', 'mobilePlaceholder')} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {t('register', 'emailVerifyNote')}
              </p>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">
                {t('common', 'back')}
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading
                ? t('common', 'creating')
                : step < STEPS.length - 1
                  ? t('common', 'continue')
                  : t('register', 'title')}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('register', 'alreadyRegistered')}{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('register', 'loginLink')}</Link>
        </p>
      </div>
    </div>
  )
}
