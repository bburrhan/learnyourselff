import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLogin: React.FC = () => {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (user && user.app_metadata?.role === 'admin') {
      navigate('/en/admin', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signIn(email.trim(), password)

      if (error) {
        toast.error('Invalid email or password.')
        return
      }

      if (data?.user?.app_metadata?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.')
        return
      }

      toast.success('Welcome back!')
      navigate('/en/admin', { replace: true })
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-5">
            <Shield className="w-7 h-7 text-gray-300" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Admin Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Restricted access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-950 font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-700 mt-8">
          This page is not publicly listed.
        </p>
      </div>
    </div>
  )
}

export default AdminLogin
