import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
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
  const { t } = useLang()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    name: '', gender: '', date_of_birth: '', height_cm: '', marital_status: 'never_married',
    mother_tongue: 'Marathi', religion: 'Hindu', community: '', city: '', about_me: '',
    qualification: '', profession: '', annual_income: '',
    family_type: 'joint', father_occupation: '', mother_occupation: '', siblings_count: '0',
    contact_name: '', contact_type: 'father', contact_mobile: '',
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
          contact_name: p.contact_name || '',
          contact_type: p.contact_type || 'father',
          contact_mobile: p.contact_mobile || '',
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
        toast.success(t('editProfile', 'profileCreated'))
      } else {
        await api.put('/profiles/me', payload)
        toast.success(t('editProfile', 'profileUpdated'))
      }
      await refreshProfile()
      navigate('/profile/me')
    } catch (err) {
      toast.error(err.response?.data?.detail || t('editProfile', 'couldNotSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
    </div>
  )

  const qualifications = t('editProfile', 'qualifications')
  const incomes = t('editProfile', 'incomes')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-1">{isNew ? t('editProfile', 'titleCreate') : t('editProfile', 'titleEdit')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('editProfile', 'subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">{t('editProfile', 'personalDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('editProfile', 'fullName')}>
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('editProfile', 'gender')}>
              <select className="input" required value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">{t('editProfile', 'selectGender')}</option>
                <option value="male">{t('editProfile', 'male')}</option>
                <option value="female">{t('editProfile', 'female')}</option>
                <option value="other">{t('editProfile', 'other')}</option>
              </select>
            </Field>
            <Field label={t('editProfile', 'dateOfBirth')}>
              <input type="date" className="input" required value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
            </Field>
            <Field label={t('editProfile', 'height')}>
              <input type="number" className="input" value={form.height_cm}
                onChange={(e) => set('height_cm', e.target.value)} placeholder="e.g. 165" min={100} max={250} />
            </Field>
            <Field label={t('editProfile', 'maritalStatus')}>
              <select className="input" value={form.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
                <option value="never_married">{t('editProfile', 'neverMarried')}</option>
                <option value="divorced">{t('editProfile', 'divorced')}</option>
                <option value="widowed">{t('editProfile', 'widowed')}</option>
                <option value="awaiting_divorce">{t('editProfile', 'awaitingDivorce')}</option>
              </select>
            </Field>
            <Field label={t('editProfile', 'motherTongue')}>
              <input className="input" value={form.mother_tongue} onChange={(e) => set('mother_tongue', e.target.value)} />
            </Field>
            <Field label={t('editProfile', 'religion')}>
              <input className="input" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
            </Field>
            <Field label={t('editProfile', 'community')}>
              <select className="input" value={form.community} onChange={(e) => set('community', e.target.value)}>
                <option value="">{t('common', 'select')}</option>
                {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={t('editProfile', 'city')}>
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)}
                placeholder={t('editProfile', 'cityPlaceholder')} />
            </Field>
          </div>
          <Field label={t('editProfile', 'aboutMe')}>
            <textarea className="input" rows={4} value={form.about_me}
              onChange={(e) => set('about_me', e.target.value)}
              placeholder={t('editProfile', 'aboutMePlaceholder')} />
          </Field>
        </div>

        {/* Education */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">{t('editProfile', 'educationCareer')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('editProfile', 'qualification')}>
              <select className="input" value={form.qualification} onChange={(e) => set('qualification', e.target.value)}>
                <option value="">{t('common', 'select')}</option>
                {qualifications.map((q, i) => (
                  <option key={i} value={['10th Pass', '12th Pass', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'][i]}>{q}</option>
                ))}
              </select>
            </Field>
            <Field label={t('editProfile', 'profession')}>
              <input className="input" value={form.profession} onChange={(e) => set('profession', e.target.value)}
                placeholder={t('editProfile', 'professionPlaceholder')} />
            </Field>
            <Field label={t('editProfile', 'annualIncome')}>
              <select className="input" value={form.annual_income} onChange={(e) => set('annual_income', e.target.value)}>
                <option value="">{t('common', 'preferNotToSay')}</option>
                {incomes.map((inc, i) => (
                  <option key={i} value={['Below ₹2 Lakh', '₹2–5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', 'Above ₹20 Lakh'][i]}>{inc}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Family */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-700">{t('editProfile', 'familyBackground')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('editProfile', 'familyType')}>
              <select className="input" value={form.family_type} onChange={(e) => set('family_type', e.target.value)}>
                <option value="joint">{t('editProfile', 'joint')}</option>
                <option value="nuclear">{t('editProfile', 'nuclear')}</option>
                <option value="extended">{t('editProfile', 'extended')}</option>
              </select>
            </Field>
            <Field label={t('editProfile', 'siblings')}>
              <input type="number" className="input" value={form.siblings_count}
                onChange={(e) => set('siblings_count', e.target.value)} min={0} max={20} />
            </Field>
            <Field label={t('editProfile', 'fatherOccupation')}>
              <input className="input" value={form.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} />
            </Field>
            <Field label={t('editProfile', 'motherOccupation')}>
              <input className="input" value={form.mother_occupation} onChange={(e) => set('mother_occupation', e.target.value)} />
            </Field>
          </div>

          {/* Contact for communication */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">{t('editProfile', 'contactSection')}</p>
            <Field label={t('editProfile', 'contactName')}>
              <input className="input" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder={t('editProfile', 'contactNamePlaceholder')} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('editProfile', 'relation')}>
                <select className="input" value={form.contact_type} onChange={(e) => set('contact_type', e.target.value)}>
                  <option value="father">{t('editProfile', 'father')}</option>
                  <option value="mother">{t('editProfile', 'mother')}</option>
                  <option value="brother">{t('editProfile', 'brother')}</option>
                  <option value="uncle">{t('editProfile', 'uncle')}</option>
                  <option value="aunt">{t('editProfile', 'aunt')}</option>
                </select>
              </Field>
              <Field label={t('editProfile', 'mobile')}>
                <input type="tel" className="input" value={form.contact_mobile} onChange={(e) => set('contact_mobile', e.target.value)} placeholder={t('editProfile', 'mobilePlaceholder')} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">{t('editProfile', 'cancel')}</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving
              ? t('common', 'saving')
              : isNew ? t('editProfile', 'createProfile') : t('editProfile', 'saveChanges')}
          </button>
        </div>
      </form>
    </div>
  )
}
