import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const STATE = { loading: 'loading', success: 'success', error: 'error' }

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState(STATE.loading)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setState(STATE.error)
      setMessage('No verification token found in the link.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setState(STATE.success)
        setMessage(res.data.message)
        setTimeout(() => navigate('/login?verified=true'), 3000)
      })
      .catch((err) => {
        setState(STATE.error)
        setMessage(err.response?.data?.detail || 'Verification failed. The link may be invalid or expired.')
      })
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-saffron-50">
      <div className="card w-full max-w-md p-10 text-center page-enter">

        {state === STATE.loading && (
          <>
            <div className="w-14 h-14 rounded-full border-4 border-primary-300 border-t-primary-700 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-700">Verifying your email…</h2>
          </>
        )}

        {state === STATE.success && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-400 mb-4">Redirecting to login in 3 seconds…</p>
            <Link to="/login" className="btn-primary inline-block px-8">Go to Login</Link>
          </>
        )}

        {state === STATE.error && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn-primary">Back to Login</Link>
              <p className="text-sm text-gray-500">
                Need a new link?{' '}
                <Link to="/login" className="text-primary-600 hover:underline">
                  Resend verification email
                </Link>
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
