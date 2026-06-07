import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

function photoUrl(path) {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`
}

export default function PhotoManager() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  async function loadPhotos() {
    try {
      const res = await api.get('/profiles/me')
      setPhotos(res.data.photos || [])
    } catch {
      toast.error('Could not load photos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPhotos() }, [])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post('/profiles/me/photos?is_public=true', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Photo uploaded!')
      loadPhotos()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  async function togglePrivacy(photo) {
    try {
      await api.patch(`/profiles/me/photos/${photo.id}/privacy`, { is_public: !photo.is_public })
      toast.success(photo.is_public ? 'Set to private' : 'Set to public')
      loadPhotos()
    } catch {
      toast.error('Could not update privacy')
    }
  }

  async function setPrimary(photo) {
    try {
      await api.patch(`/profiles/me/photos/${photo.id}/primary`)
      toast.success('Primary photo updated')
      loadPhotos()
    } catch {
      toast.error('Could not set primary')
    }
  }

  async function deletePhoto(photo) {
    if (!confirm('Delete this photo?')) return
    try {
      await api.delete(`/profiles/me/photos/${photo.id}`)
      toast.success('Photo deleted')
      loadPhotos()
    } catch {
      toast.error('Could not delete photo')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">My Photos</h1>
          <p className="text-gray-500 text-sm">Upload up to 10 photos · Max 5 MB each</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || photos.length >= 10}
            className="btn-primary"
          >
            {uploading ? 'Uploading…' : '+ Add Photo'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">📷</p>
          <h3 className="font-bold text-gray-700">No photos yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">Profiles with photos get 5× more interest</p>
          <button onClick={() => fileRef.current?.click()} className="btn-primary">Upload First Photo</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="card overflow-hidden group">
              <div className="relative aspect-square">
                <img src={photoUrl(photo.storage_path)} alt="" className="w-full h-full object-cover" />
                {photo.is_primary && (
                  <span className="absolute top-2 left-2 badge badge-pink text-xs">Primary</span>
                )}
                {!photo.is_public && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🔒 Private</span>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                {!photo.is_primary && (
                  <button onClick={() => setPrimary(photo)} className="btn-secondary w-full text-xs py-1.5">
                    Set as Primary
                  </button>
                )}
                <button onClick={() => togglePrivacy(photo)} className="btn-secondary w-full text-xs py-1.5">
                  {photo.is_public ? '🔒 Make Private' : '🌐 Make Public'}
                </button>
                <button onClick={() => deletePhoto(photo)} className="btn-danger w-full text-xs py-1.5">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <strong>Privacy tip:</strong> Public photos are visible to all members. Private photos are visible only after your interest is accepted.
      </div>
    </div>
  )
}
