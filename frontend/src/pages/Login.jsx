import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ShieldCheck, CheckCircle, Sparkles, User, Lock, Mail, Cpu, Play, KeyRound } from 'lucide-react'
import { api } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  
  // View state: 'login' | 'register-new-user'
  const [view, setView] = useState('login')
  
  // Form fields state
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin')
  const [password, setPassword] = useState('1234578')
  const [name, setName] = useState('')
  const [profession, setProfession] = useState('')
  const [googleToken, setGoogleToken] = useState('')
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleConfigured, setGoogleConfigured] = useState(true)

  const API_BASE = api.getApiBase()

  useEffect(() => {
    const initGoogleOAuth = async () => {
      try {
        const configRes = await fetch(`${API_BASE}/api/v1/auth/config`)
        if (configRes.ok) {
          const config = await configRes.json()
          if (config.clientId && config.clientId !== 'your-google-client-id-here.apps.googleusercontent.com' && window.google) {
            window.handleCredentialResponse = async (response) => {
              setLoading(true)
              setErrorMsg('')
              setGoogleToken(response.credential)
              try {
                const loginRes = await fetch(`${API_BASE}/api/v1/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: response.credential })
                })

                if (loginRes.ok) {
                  const data = await loginRes.json()
                  if (data.registered) {
                    localStorage.setItem('vibebench_token', data.token)
                    localStorage.setItem('vibebench_email', data.email)
                    localStorage.setItem('vibebench_name', data.name)
                    localStorage.setItem('vibebench_role', data.role)
                    localStorage.setItem('vibebench_profession', data.profession || '')
                    navigate('/dashboard')
                  } else {
                    setUsernameOrEmail(data.email)
                    setName(data.name || '')
                    setView('register-new-user')
                  }
                } else {
                  const errData = await loginRes.json()
                  setErrorMsg('Google login failed: ' + (errData.detail || errData.error || 'Authentication rejected'))
                }
              } catch (error) {
                console.error('Network verification failed', error)
                setErrorMsg('Could not connect to backend.')
              } finally {
                setLoading(false)
              }
            }

            window.google.accounts.id.initialize({
              client_id: config.clientId,
              callback: window.handleCredentialResponse
            })

            const btnContainer = document.getElementById('google-btn-container')
            if (btnContainer) {
              window.google.accounts.id.renderButton(
                btnContainer,
                { theme: 'outline', size: 'large', text: 'signin_with', width: 340, shape: 'pill' }
              )
            }
          } else {
            setGoogleConfigured(false)
          }
        }
      } catch (err) {
        setGoogleConfigured(false)
      }
    }

    const timer = setTimeout(() => {
      initGoogleOAuth()
    }, 600)

    return () => clearTimeout(timer)
  }, [navigate, API_BASE])

  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault()
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Please enter username/email and password')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const data = await api.login(usernameOrEmail.trim(), password.trim())
      localStorage.setItem('vibebench_token', data.token)
      localStorage.setItem('vibebench_email', data.email)
      localStorage.setItem('vibebench_name', data.name)
      localStorage.setItem('vibebench_role', data.role)
      localStorage.setItem('vibebench_profession', data.profession || 'Admin')
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAdminLogin = async () => {
    setUsernameOrEmail('admin')
    setPassword('1234578')
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await api.login('admin', '1234578')
      localStorage.setItem('vibebench_token', data.token)
      localStorage.setItem('vibebench_email', data.email)
      localStorage.setItem('vibebench_name', data.name)
      localStorage.setItem('vibebench_role', data.role)
      localStorage.setItem('vibebench_profession', data.profession || 'Admin')
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Admin login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoGuestLogin = () => {
    localStorage.setItem('vibebench_token', 'guest_token_' + Date.now())
    localStorage.setItem('vibebench_email', 'guest@vibebench.ai')
    localStorage.setItem('vibebench_name', 'Guest Researcher')
    localStorage.setItem('vibebench_role', 'ROLE_USER')
    localStorage.setItem('vibebench_profession', 'Researcher')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#101114] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background ambient spots */}
      <div className="ambient-glow-coral top-0 right-0 opacity-40 pointer-events-none" />
      <div className="ambient-glow-violet bottom-0 left-0 opacity-40 pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10">
        <div className="glass-card rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/90 space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#101114] flex items-center justify-center shadow-md mb-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 4L12 20L20 4" stroke="url(#login-grad-inner)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="login-grad-inner" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6B4A" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-[#101114] tracking-tight">
              Sign in to VibeBench
            </h1>
            <p className="text-xs text-[#5F6470]">
              Access isolated Docker telemetry, leaderboard, and live benchmark runs.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {view === 'login' ? (
            <div className="space-y-4">
              {/* Quick Admin Access Button */}
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>One-Click Login as Admin (admin / 1234578)</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase">or enter credentials</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              {/* Standard Username/Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-3 text-left text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Username or Email</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="admin or user@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-black/10 text-[#101114] focus:outline-none focus:ring-2 focus:ring-black/10 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-black/10 text-[#101114] focus:outline-none focus:ring-2 focus:ring-black/10 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#101114] hover:bg-[#23262E] text-white font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Password'}
                </button>
              </form>

              {/* Google Button Container */}
              <div id="google-btn-container" className="flex justify-center min-h-[40px] pt-1" />

              {/* Guest Login */}
              <button
                type="button"
                onClick={handleDemoGuestLogin}
                className="w-full py-2 px-3 text-[11px] text-gray-500 hover:text-black font-semibold transition-colors cursor-pointer"
              >
                Continue as Guest / Viewer →
              </button>
            </div>
          ) : (
            /* Registration completion form for Google new users */
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-black/10 text-[#101114] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Role / Profession</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. AI Researcher, Staff Engineer"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-black/10 text-[#101114] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#101114] hover:bg-[#23262E] text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Completing Setup...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-7xl w-full mx-auto text-center text-xs text-gray-400 z-10">
        © 2026 VibeBench • Built for evaluating AI-generated software.
      </div>
    </div>
  )
}
