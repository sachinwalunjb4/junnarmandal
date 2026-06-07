import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const FEATURES = [
  { icon: '🔍', title: 'Smart Search', desc: 'Filter by age, religion, community, location and more.' },
  { icon: '💡', title: 'Match Score', desc: 'AI-powered compatibility score based on your preferences.' },
  { icon: '💌', title: 'Express Interest', desc: 'Send interest; chat only after mutual acceptance.' },
  { icon: '🔒', title: 'Privacy First', desc: 'Contact details hidden until interest is accepted.' },
  { icon: '📸', title: 'Photo Albums', desc: 'Upload multiple photos with public/private control.' },
  { icon: '🛡️', title: 'Verified Profiles', desc: 'Every profile reviewed by our admin team.' },
]

const STATS = [
  { value: '10,000+', label: 'Registered Members' },
  { value: '3,500+', label: 'Successful Matches' },
  { value: '500+', label: 'Junnar Families' },
]

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-saffron-500 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff opacity=0.05%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <p className="text-primary-200 font-devanagari text-lg mb-2">जुन्नर तालुका विवाह मंच</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find Your Perfect Life Partner<br />
            <span className="text-saffron-300">from Junnar Taluka</span>
          </h1>
          <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Trusted matrimony platform for the Marathi community of Junnar, Narayangaon, Otur, Manchar, Rajgurunagar and surrounding areas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary bg-white !text-primary-700 hover:bg-primary-50 text-base px-8 py-3 shadow-lg">
              Register Free
            </Link>
            <Link to="/login" className="btn-secondary bg-transparent border-white !text-white hover:bg-white/10 text-base px-8 py-3">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-3 gap-4 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-bold text-primary-700">{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Why Junnar Lagna Mandal?</h2>
          <p className="text-gray-500 mt-2">Built for our community, by our community</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-saffron-500 to-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-white/80 mb-8">Join thousands of families who found their perfect match through Junnar Lagna Mandal.</p>
          <Link to="/register" className="btn-primary bg-white !text-primary-700 hover:bg-primary-50 text-base px-10 py-3 shadow-lg">
            Create Free Profile
          </Link>
        </div>
      </section>
    </div>
  )
}
