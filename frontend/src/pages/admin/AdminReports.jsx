import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow, parseISO } from 'date-fns'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')

  async function load(status = statusFilter) {
    setLoading(true)
    try {
      const res = await api.get(`/admin/reports?report_status=${status}`)
      setReports(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  async function resolve(reportId, status) {
    const note = status === 'resolved' ? prompt('Admin note (optional):') : null
    try {
      await api.patch(`/admin/reports/${reportId}`, { status, admin_note: note || null })
      toast.success(`Report marked as ${status}`)
      load()
    } catch {
      toast.error('Could not update report')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-primary-600 text-sm hover:underline">← Admin</Link>
        <h1 className="section-title">Reports</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🚩</p>
          <p className="font-semibold text-gray-700">No {statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="card p-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 text-sm mb-2">
                    <span className="text-gray-500">Reporter:</span>
                    <Link to={`/profile/${report.reporter_id}`} className="text-primary-600 font-medium hover:underline truncate">
                      {report.reporter_id.slice(0, 8)}…
                    </Link>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-500">Reported:</span>
                    <Link to={`/profile/${report.reported_id}`} className="text-red-600 font-medium hover:underline truncate">
                      {report.reported_id.slice(0, 8)}…
                    </Link>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">{report.reason}</p>
                  {report.details && <p className="text-gray-500 text-sm mt-1">{report.details}</p>}
                  {report.admin_note && (
                    <p className="text-blue-600 text-xs mt-1 bg-blue-50 px-2 py-1 rounded">Note: {report.admin_note}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => resolve(report.id, 'resolved')}
                      className="btn-primary text-xs py-1.5 px-3">Resolve</button>
                    <button onClick={() => resolve(report.id, 'dismissed')}
                      className="btn-secondary text-xs py-1.5 px-3 text-gray-600">Dismiss</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
