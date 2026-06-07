import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  async function load(p = page) {
    setLoading(true)
    try {
      const res = await api.get(`/admin/users?page=${p}&page_size=20`)
      setUsers(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  async function toggleActive(user) {
    const label = user.is_active ? 'deactivate' : 'activate'
    if (!confirm(`${label} this account?`)) return
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active: !user.is_active })
      toast.success(`User ${label}d`)
      load()
    } catch {
      toast.error('Could not update user')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-primary-600 text-sm hover:underline">← Admin</Link>
        <h1 className="section-title">All Users</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Email', 'Name', 'Location', 'Status', 'Admin', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[180px]">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.profile ? (
                      <Link to={`/profile/${u.id}`} className="hover:text-primary-600">{u.profile.name}</Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.profile?.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin && <span className="badge badge-pink">Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {format(parseISO(u.created_at), 'dd MMM yy')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                        u.is_active
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
