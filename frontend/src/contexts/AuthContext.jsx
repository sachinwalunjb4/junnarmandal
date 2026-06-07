import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import api from '../services/api'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [token])

  async function fetchMe() {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      const profileRes = await api.get('/profiles/me').catch(() => null)
      if (profileRes) setProfile(profileRes.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token, user: u } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setToken(access_token)
    setUser(u)
    const profileRes = await api.get('/profiles/me').catch(() => null)
    if (profileRes) setProfile(profileRes.data)
    return res.data
  }

  async function signup(email, password, name) {
    const res = await api.post('/auth/signup', { email, password, name })
    return res.data
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    setProfile(null)
  }

  function refreshProfile() {
    return fetchMe()
  }

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { supabase }
