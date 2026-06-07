import { useEffect, useState } from 'react'
import api from '../services/api'
import ProfileCard from '../components/ProfileCard'
import toast from 'react-hot-toast'

export default function Shortlists() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/shortlists')
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function remove(id) {
    try {
      await api.delete(`/shortlists/${id}`)
      toast.success('Removed from shortlist')
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error('Could not remove')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <h1 className="section-title mb-1">My Shortlist</h1>
      <p className="text-gray-500 text-sm mb-6">Profiles you've saved for later</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-3">♡</p>
          <h3 className="font-bold text-gray-700">Your shortlist is empty</h3>
          <p className="text-gray-400 text-sm mt-1">Tap the ♡ button on any profile card to save it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <ProfileCard profile={item.profile} />
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-white text-sm font-bold"
                title="Remove from shortlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
