import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Preferences from './pages/Preferences'
import Search from './pages/Search'
import Matches from './pages/Matches'
import Interests from './pages/Interests'
import Shortlists from './pages/Shortlists'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import PhotoManager from './pages/PhotoManager'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProfiles from './pages/admin/AdminProfiles'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-300 border-t-primary-700 animate-spin" />
          <p className="text-primary-700 font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected – any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile/me" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/photos" element={<PhotoManager />} />
            <Route path="/profile/preferences" element={<Preferences />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/shortlists" element={<Shortlists />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:partnerId" element={<Chat />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/profiles" element={<AdminProfiles />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
