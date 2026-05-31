import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Cpu, User, ArrowRight, ArrowLeft, Mail, Briefcase, CheckCircle } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  
  // View state: 'google-login' or 'register-new-user'
  const [view, setView] = useState('google-login')
  
  // Form fields state (for new user registration onboarding)
  const [googleToken, setGoogleToken] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [profession, setProfession] = useState('')
  
  // Validation / Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleConfigured, setGoogleConfigured] = useState(true)

  const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : '');

  useEffect(() => {
    // Fetch Google Client Config & Render Buttons
    const initGoogleOAuth = async () => {
      try {
        const configRes = await fetch(`${API_BASE}/api/v1/auth/config`)
        if (configRes.ok) {
          const config = await configRes.json()
          if (config.clientId && config.clientId !== 'your-google-client-id-here.apps.googleusercontent.com') {
            // Define global callback handler for Google GIS
            window.handleCredentialResponse = async (response) => {
              setLoading(true)
              setErrorMsg('')
              setSuccessMsg('')
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
                    
                    // Redirect to protected dashboard
                    navigate('/dashboard')
                  } else {
                    // User exists on Google but not in DB -> Route to profile completion
                    setEmail(data.email)
                    setName(data.name || '')
                    setView('register-new-user')
                  }
                } else {
                  const errData = await loginRes.json()
                  setErrorMsg('Google login failed: ' + (errData.error || 'Authentication rejected'))
                }
              } catch (error) {
                console.error('Network verification failed', error)
                setErrorMsg('Could not connect to authentication gateway.')
              } finally {
                setLoading(false)
              }
            }

            // Initialize GIS
            window.google.accounts.id.initialize({
              client_id: config.clientId,
              callback: window.handleCredentialResponse
            })

            // Render Google Button if we are on the login view
            if (view === 'google-login') {
              window.google.accounts.id.renderButton(
                document.getElementById('google-btn-container'),
                { theme: 'outline', size: 'large', text: 'signin_with', width: 340, shape: 'pill' }
              )
            }
          } else {
            setGoogleConfigured(false)
          }
        }
      } catch (err) {
        console.error('Google client initialization error', err)
        setGoogleConfigured(false)
      }
    }

    // Small delay to ensure Google script has loaded in DOM
    const timer = setTimeout(() => {
      if (window.google) {
        initGoogleOAuth()
      } else {
        setGoogleConfigured(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [navigate, view])

  const handleGoogleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !profession.trim()) {
      setErrorMsg('Name and profession are required')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/google/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: googleToken, name, profession })
      })

      const data = await res.json()

      if (res.ok && data.registered) {
        localStorage.setItem('vibebench_token', data.token)
        localStorage.setItem('vibebench_email', data.email)
        localStorage.setItem('vibebench_name', data.name)
        localStorage.setItem('vibebench_role', data.role)
        localStorage.setItem('vibebench_profession', data.profession || '')
        
        navigate('/dashboard')
      } else {
        setErrorMsg(data.error || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration network failure', err)
      setErrorMsg('Connection error. Could not connect to authentication gateway.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = () => {
    setView('google-login')
    setGoogleToken('')
    setEmail('')
    setName('')
    setProfession('')
    setErrorMsg('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-earth-dark text-cream-ivory px-4 relative overflow-hidden">
      
      {/* Auth Card */}
      <div className="w-full max-w-md bg-earth-card border border-border-pink/80 rounded-3xl p-7 md:p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-6 relative z-10 transition-transform duration-300 hover:scale-[1.01]">
        
        {/* Brand / Logo Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="VibeBench Logo" className="w-16 h-16 rounded-full object-cover border border-border-pink/80 mb-1" />
          <h1 className="text-3xl font-extrabold font-display leading-none tracking-tight">
            Vibe<span className="text-sage-green">Bench</span>
          </h1>
          <p className="text-dusty-rose text-xs max-w-[280px] mt-1.5 leading-relaxed font-semibold">
            See who's the better VibeCoder
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-sage-green/10 border border-sage-green/30 rounded-2xl text-sage-green text-xs font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-950/20 border border-red-800/35 rounded-2xl text-red-300 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication View */}
        {view === 'google-login' && (
          <div className="w-full flex flex-col items-center gap-4 py-4 animate-fade-in">
            {googleConfigured ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <span className="text-xs font-bold text-dusty-rose uppercase tracking-wider">Sign In via Google</span>
                <div id="google-btn-container" className="transition-transform hover:scale-105 active:scale-95 duration-200"></div>
                <p className="text-[10px] text-center text-dusty-rose/50 max-w-[260px] leading-relaxed mt-2">
                  First-time Google logins will prompt you to enter your Details.
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2.5 px-4 py-3 bg-yellow-950/20 border border-yellow-800/25 rounded-2xl text-yellow-300/90 text-xs leading-relaxed">
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Google Auth Offline</span>
                </div>
                <p>
                  VIBEBENCH_GOOGLE_CLIENT_ID is missing or configured with placeholder values. Please check your backend properties configuration.
                </p>
              </div>
            )}
          </div>
        )}

        {/* New User Profile Registration View */}
        {view === 'register-new-user' && (
          <form onSubmit={handleGoogleRegisterSubmit} className="flex flex-col gap-5 animate-fade-in">
            <div className="flex flex-col gap-1 border-b border-border-pink/40 pb-2 mb-1">
              <h2 className="text-lg font-bold text-sage-green font-display">Create VibeBench Profile</h2>
              <p className="text-dusty-rose/70 text-[11px] leading-relaxed">
                Please complete your onboarding profile details.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dusty-rose uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-dusty-rose/60" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-earth-dark/60 border border-border-pink/80 rounded-xl pl-10 pr-4 py-3 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dusty-rose/50 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-dusty-rose/30" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-earth-dark/30 border border-border-pink/30 rounded-xl pl-10 pr-4 py-3 text-sm text-cream-ivory/50 cursor-not-allowed font-sans select-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-dusty-rose uppercase tracking-wider">Profession / Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-dusty-rose/60" />
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Software Engineer, ML Researcher"
                  className="w-full bg-earth-dark/60 border border-border-pink/80 rounded-xl pl-10 pr-4 py-3 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-rose-pink hover:bg-rose-pink/95 text-earth-dark rounded-xl font-bold font-display transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCancelRegistration}
                className="w-full py-2.5 bg-transparent hover:bg-earth-medium/20 border border-border-pink/40 hover:border-border-pink text-dusty-rose rounded-xl font-medium transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}

      </div>
      
      {/* Background ambient branding */}
      <div className="absolute bottom-4 left-4 text-[10px] text-dusty-rose/30 font-mono pointer-events-none select-none">
        VibeBench Security Framework
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-dusty-rose/30 font-mono pointer-events-none select-none">
        Local Database Storage
      </div>
    </div>
  )
}

export default Login
