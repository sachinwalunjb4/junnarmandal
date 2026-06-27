import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV_LINKS = [
    { to: '/dashboard',  label: t('nav', 'home') },
    { to: '/matches',    label: t('nav', 'matches') },
    { to: '/search',     label: t('nav', 'search') },
    { to: '/interests',  label: t('nav', 'interests') },
    { to: '/shortlists', label: t('nav', 'shortlists') },
    { to: '/messages',   label: t('nav', 'messages') },
  ]

  function handleLogout() {
    logout()
    toast.success(lang === 'mr' ? 'लॉगआउट यशस्वी' : 'Logged out')
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🪷</span>
            <div className="leading-tight">
              <p className="text-primary-700 font-bold text-base leading-none">Junnar</p>
              <p className="text-saffron-600 text-xs font-semibold leading-none font-devanagari">लग्न मंडळ</p>
            </div>
          </Link>

          {/* Desktop nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {user.is_admin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-saffron-50 text-saffron-700'
                      : 'text-gray-500 hover:text-saffron-700'
                  }`}
                >
                  {t('nav', 'admin')}
                </Link>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-2 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-devanagari"
              title={lang === 'en' ? 'मराठीत बदला' : 'Switch to English'}
            >
              {lang === 'en' ? 'मराठी' : 'English'}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-700"
                >
                  <span className="hidden sm:block">
                    {profile?.name || user.email?.split('@')[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {(profile?.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link to="/profile/me" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav', 'myProfile')}</Link>
                    <Link to="/profile/edit" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav', 'editProfile')}</Link>
                    <Link to="/profile/photos" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav', 'managePhotos')}</Link>
                    <Link to="/profile/preferences" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav', 'preferences')}</Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => { setMenuOpen(false); handleLogout() }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      {t('nav', 'logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-xs px-4 py-2">{t('nav', 'login')}</Link>
                <Link to="/register" className="btn-primary text-xs px-4 py-2">{t('nav', 'register')}</Link>
              </>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setMenuOpen((o) => !o)}
              >
                ☰
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && user && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname.startsWith(to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
