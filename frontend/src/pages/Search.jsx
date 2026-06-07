import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import ProfileCard from '../components/ProfileCard'

const EMPTY_FILTERS = {
  gender: '', min_age: '', max_age: '', religion: '', community: '',
  city: '', qualification: '', marital_status: '', sort_by: 'last_active',
}

export default function Search() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [results, setResults] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const doSearch = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, page_size: 12, ...filters }
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
      const res = await api.get('/search', { params })
      setResults(res.data.items)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { doSearch(1) }, [filters.sort_by])

  function set(k, v) { setFilters((f) => ({ ...f, [k]: v })) }

  function handleSearch(e) {
    e.preventDefault()
    doSearch(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Search Profiles</h1>
          {!loading && <p className="text-gray-500 text-sm">{pagination.total} profiles found</p>}
        </div>
        <button onClick={() => setFiltersOpen((o) => !o)} className="btn-secondary md:hidden">
          {filtersOpen ? 'Hide Filters' : 'Filters'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0`}>
          <form onSubmit={handleSearch} className="card p-5 space-y-4 sticky top-20">
            <h3 className="font-bold text-gray-700">Filters</h3>

            <div>
              <label className="label">Looking for</label>
              <select className="input" value={filters.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Both</option>
                <option value="male">Groom</option>
                <option value="female">Bride</option>
              </select>
            </div>

            <div>
              <label className="label">Age Range</label>
              <div className="flex gap-2">
                <input type="number" className="input text-center" placeholder="Min" value={filters.min_age}
                  onChange={(e) => set('min_age', e.target.value)} min={18} max={80} />
                <input type="number" className="input text-center" placeholder="Max" value={filters.max_age}
                  onChange={(e) => set('max_age', e.target.value)} min={18} max={80} />
              </div>
            </div>

            <div>
              <label className="label">Religion</label>
              <input className="input" placeholder="Any" value={filters.religion}
                onChange={(e) => set('religion', e.target.value)} />
            </div>

            <div>
              <label className="label">Community</label>
              <input className="input" placeholder="Any" value={filters.community}
                onChange={(e) => set('community', e.target.value)} />
            </div>

            <div>
              <label className="label">City / Location</label>
              <input className="input" placeholder="Any" value={filters.city}
                onChange={(e) => set('city', e.target.value)} />
            </div>

            <div>
              <label className="label">Marital Status</label>
              <select className="input" value={filters.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
                <option value="">Any</option>
                <option value="never_married">Never Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="label">Sort By</label>
              <select className="input" value={filters.sort_by} onChange={(e) => set('sort_by', e.target.value)}>
                <option value="last_active">Recently Active</option>
                <option value="created_at">Newest</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full">Search</button>
            <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); doSearch(1) }} className="btn-secondary w-full text-xs">
              Clear Filters
            </button>
          </form>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="font-bold text-gray-700">No profiles found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => doSearch(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => doSearch(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
