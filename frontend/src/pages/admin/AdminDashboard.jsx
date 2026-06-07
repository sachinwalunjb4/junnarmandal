import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const STAT_CARD = ({ title, value, to, color }) => (
  <Link to={to} className="card p-6 hover:shadow-md transition-shadow">
    <p className={`text-4xl font-bold ${color}`}>{value ?? '—'}</p>
    <p className="text-gray-500 text-sm mt-1">{title}</p>
  </Link>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage profiles, reports and users</p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { to: '/admin/profiles', label: 'Pending Profiles', icon: '👤' },
          { to: '/admin/reports',  label: 'Reports',          icon: '🚩' },
          { to: '/admin/users',    label: 'All Users',        icon: '👥' },
        ].map(({ to, label, icon }) => (
          <Link key={to} to={to} className="btn-secondary gap-2">
            <span>{icon}</span> {label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <STAT_CARD title="Total Users"       value={stats?.total_users}      to="/admin/users"    color="text-blue-600" />
          <STAT_CARD title="Pending Profiles"  value={stats?.pending_profiles} to="/admin/profiles" color="text-yellow-600" />
          <STAT_CARD title="Pending Reports"   value={stats?.pending_reports}  to="/admin/reports"  color="text-red-600" />
          <STAT_CARD title="Total Messages"    value={stats?.total_messages}   to="/admin/users"    color="text-green-600" />
          <STAT_CARD title="Total Interests"   value={stats?.total_interests}  to="/admin/users"    color="text-purple-600" />
        </div>
      )}
    </div>
  )
}
