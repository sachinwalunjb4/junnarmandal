import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    const verified = searchParams.get('verified')
    const error = searchParams.get('error')
    if (verified === 'true') toast.success('Email verified! You can now log in.')
    else if (verified === 'already') toast('Email was already verified.', { icon: 'ℹ️' })
    else if (error === 'invalid_token') toast.error('Invalid verification link.')
    else if (error === 'token_expired') toast.error('Verification link expired. Request a new one below.')
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification(e) {
    e.preventDefault()
    try {
      await api.post('/auth/resend-verification', { email: resetEmail })
      toast.success('Verification link sent if that email is registered.')
      setShowReset(false)
    } catch {
      toast.error('Could not send email. Please try again.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-saffron-50">
      <div className="card w-full max-w-md p-8 page-enter">
        <div className="text-center mb-8">
          <span className="text-4xl">🪷</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Login to Junnar Lagna Mandal</p>
        </div>

        {!showReset ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Logging in…' : 'Login'}
            </button>
            <p className="text-center text-sm">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-primary-600 hover:underline"
              >
                Didn't receive verification email?
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResendVerification} className="space-y-4">
            <p className="text-sm text-gray-600">Enter your email to resend the verification link.</p>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">Resend Verification Email</button>
            <button type="button" onClick={() => setShowReset(false)} className="btn-secondary w-full">
              Back to Login
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          New user?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Create free profile
          </Link>
        </p>
      </div>
    </div>
  )
}
