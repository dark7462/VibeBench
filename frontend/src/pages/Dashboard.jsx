import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, Trophy, Timer, DollarSign, Play, LogOut, X, 
  Terminal, Code2, AlertTriangle, CheckCircle, RefreshCw, Cpu
} from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  
  // State
  const [stats, setStats] = useState({ totalRuns: 0, topModel: 'N/A', avgLatencyMs: 0, totalCostUsd: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [runs, setRuns] = useState([])
  const [activeJobId, setActiveJobId] = useState(null)
  const [activeJob, setActiveJob] = useState(null)
  
  // Modals state
  const [triggerModalOpen, setTriggerModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  
  // Trigger form state
  const [modelName, setModelName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [refRepo, setRefRepo] = useState('')
  const [promptText, setPromptText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const logEndRef = useRef(null)

  const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:8080`
    : '');
  const adminEmail = 'anu870906@gmail.com'
  
  // Storage getters
  const token = localStorage.getItem('vibebench_token')
  const email = localStorage.getItem('vibebench_email') || ''
  const name = localStorage.getItem('vibebench_name') || ''
  const role = localStorage.getItem('vibebench_role') || ''
  const isAdmin = email.toLowerCase() === adminEmail.toLowerCase()

  // Fetch API with Auth headers
  const fetchWithAuth = async (url, options = {}) => {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
    const response = await fetch(url, options)
    if (response.status === 401 || response.status === 403) {
      handleSignOut()
      return null
    }
    return response
  }

  const handleSignOut = () => {
    localStorage.removeItem('vibebench_token')
    localStorage.removeItem('vibebench_email')
    localStorage.removeItem('vibebench_name')
    localStorage.removeItem('vibebench_role')
    navigate('/login')
  }

  // Poll stats, leaderboard, and runs queue
  const loadDashboardData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE}/api/v1/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      const leaderboardRes = await fetch(`${API_BASE}/api/v1/leaderboard`)
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json()
        setLeaderboard(leaderboardData)
      }

      const runsRes = await fetchWithAuth(`${API_BASE}/api/v1/model`)
      if (runsRes && runsRes.ok) {
        const runsData = await runsRes.json()
        setRuns(runsData)
      }
    } catch (err) {
      console.error('Failed to load dashboard parameters', err)
    }
  }

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 4000)
    return () => clearInterval(interval)
  }, [])

  // Poll details of active run if modal is open
  useEffect(() => {
    if (!activeJobId || !detailsModalOpen) return

    const fetchActiveDetails = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/v1/job/${activeJobId}`)
        if (res && res.ok) {
          const data = await res.json()
          setActiveJob(data)
          
          // Auto-scroll logs terminal
          if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }
      } catch (err) {
        console.error('Failed to poll active job logs', err)
      }
    }

    fetchActiveDetails()
    
    // Poll logs faster (every 1.5s) if job is running
    const pollInterval = setInterval(() => {
      if (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED')) {
        fetchActiveDetails()
      }
    }, 1500)

    return () => clearInterval(pollInterval)
  }, [activeJobId, detailsModalOpen, activeJob?.status])

  // Handle benchmark trigger
  const handleTriggerRun = async (e) => {
    e.preventDefault()
    if (!modelName.trim() || !promptText.trim()) {
      alert('Model Name and Prompt are required')
      return
    }

    setSubmitting(true)
    const payload = {
      model_name: modelName,
      apikey: apiKey || null,
      reference_repo: refRepo || null,
      "prompt/plan.md": promptText
    }

    try {
      const res = await fetchWithAuth(`${API_BASE}/api/v1/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res && res.status === 202) {
        setTriggerModalOpen(false)
        // Reset form
        setModelName('')
        setApiKey('')
        setRefRepo('')
        setPromptText('')
        loadDashboardData()
      } else {
        alert('Failed to launch benchmark.')
      }
    } catch (err) {
      console.error('Trigger request error', err)
      alert('Connection error. Could not reach backend.')
    } finally {
      setSubmitting(false)
    }
  }

  const openJobDetails = (jobId) => {
    setActiveJobId(jobId)
    setActiveJob(null)
    setDetailsModalOpen(true)
  }

  // SVG circular progress builder
  const CircleMetricGauge = ({ percent, label }) => {
    const radius = 34
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference

    return (
      <div className="flex flex-col items-center gap-2 bg-earth-dark/45 border border-border-pink/40 p-4 rounded-2xl w-full">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
            <circle 
              cx="40" cy="40" r={radius} 
              stroke="var(--color-sage-green)" 
              strokeWidth="6" 
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-sm font-bold font-display text-cream-ivory">{percent.toFixed(0)}%</span>
        </div>
        <span className="text-xs text-dusty-rose text-center font-semibold tracking-wide uppercase">{label}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-earth-dark text-cream-ivory">
      {/* Navigation Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-border-pink/50 bg-earth-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover border border-border-pink/50" />
          <span className="text-rose-pink text-2xl font-bold font-display">Vibe<span className="text-sage-green">Bench</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-dusty-rose bg-earth-medium/60 border border-border-pink px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-green animate-pulse"></span>
            <span>{name} ({isAdmin ? 'Admin' : 'Viewer'})</span>
          </span>
          {isAdmin && (
            <button 
              onClick={() => setTriggerModalOpen(true)}
              className="flex items-center gap-2 bg-rose-pink hover:bg-rose-pink/95 text-earth-dark font-bold font-display px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-earth-dark" />
              <span>Run Benchmark</span>
            </button>
          )}
          <a 
            href="https://github.com/dark7462/VibeBench" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2.5 bg-earth-medium/40 border border-border-pink hover:border-rose-pink/40 hover:bg-earth-medium/70 text-dusty-rose hover:text-rose-pink rounded-xl transition-all duration-200"
            title="View on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
          <button 
            onClick={handleSignOut}
            className="flex items-center justify-center p-2.5 bg-earth-medium/40 border border-border-pink hover:border-rose-pink/40 hover:bg-earth-medium/70 text-dusty-rose hover:text-rose-pink rounded-xl transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-earth-card border border-border-pink rounded-2xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-pink/10 border border-rose-pink/20 flex items-center justify-center text-rose-pink">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-dusty-rose uppercase tracking-wider">Total Runs</span>
              <span className="text-2xl font-bold font-display text-cream-ivory">{stats.totalRuns}</span>
            </div>
          </div>

          <div className="bg-earth-card border border-border-pink rounded-2xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-sage-green/10 border border-sage-green/20 flex items-center justify-center text-sage-green">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-dusty-rose uppercase tracking-wider">Top Model</span>
              <span className="text-lg font-bold font-display text-cream-ivory truncate max-w-[150px] block">{stats.topModel}</span>
            </div>
          </div>

          <div className="bg-earth-card border border-border-pink rounded-2xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-pink/10 border border-rose-pink/20 flex items-center justify-center text-rose-pink">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-dusty-rose uppercase tracking-wider">Avg Latency</span>
              <span className="text-2xl font-bold font-display text-cream-ivory">{stats.avgLatencyMs ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : '0.0s'}</span>
            </div>
          </div>

          <div className="bg-earth-card border border-border-pink rounded-2xl p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-sage-green/10 border border-sage-green/20 flex items-center justify-center text-sage-green">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-dusty-rose uppercase tracking-wider">Total Cost</span>
              <span className="text-2xl font-bold font-display text-cream-ivory">{stats.totalCostUsd ? `$${stats.totalCostUsd.toFixed(3)}` : '$0.00'}</span>
            </div>
          </div>
        </section>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Leaderboard Panel (4 columns) */}
          <section className="bg-earth-card border border-border-pink rounded-3xl p-6 shadow-xl lg:col-span-5 flex flex-col h-[550px] overflow-hidden">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-4 shrink-0">
              <Trophy className="text-rose-pink w-5 h-5" />
              <span>Top Models Leaderboard</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              {leaderboard.length === 0 ? (
                <div className="h-full flex items-center justify-center text-dusty-rose text-sm">No models evaluated yet.</div>
              ) : (
                leaderboard.map((entry, index) => {
                  const rank = index + 1
                  let rankStyle = "bg-earth-dark/40 text-dusty-rose border-border-pink"
                  if (rank === 1) rankStyle = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  else if (rank === 2) rankStyle = "bg-slate-300/10 text-slate-300 border-slate-300/20"
                  else if (rank === 3) rankStyle = "bg-amber-700/10 text-amber-600 border-amber-700/20"

                  return (
                    <div key={entry.modelName} className="flex justify-between items-center p-3.5 bg-earth-medium/20 border border-border-pink/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center font-display ${rankStyle}`}>
                          {rank}
                        </div>
                        <div>
                          <h4 className="font-bold text-cream-ivory text-sm">{entry.modelName}</h4>
                          <span className="text-[10px] text-dusty-rose block mt-0.5">Runs: {entry.runCount} | Latency: {(entry.avgLatencyMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                      <div className="bg-rose-pink/15 border border-rose-pink/30 text-rose-pink text-sm font-bold font-display px-2.5 py-1 rounded-lg">
                        {entry.score.toFixed(1)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Runs History Queue (7 columns) */}
          <section className="bg-earth-card border border-border-pink rounded-3xl p-6 shadow-xl lg:col-span-7 flex flex-col h-[550px] overflow-hidden">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 mb-4 shrink-0">
              <RefreshCw className="text-sage-green w-5 h-5" />
              <span>Execution Run Queue</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {runs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-dusty-rose text-sm">No benchmark executions triggered yet.</div>
              ) : (
                runs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((run) => {
                  const dateStr = new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  let statusColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                  if (run.status === 'RUNNING') statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/25 animate-pulse"
                  else if (run.status === 'COMPLETED') statusColor = "bg-sage-green/10 text-sage-green border-border-green"
                  else if (run.status === 'FAILED') statusColor = "bg-red-500/10 text-red-400 border-red-500/25"

                  return (
                    <div 
                      key={run.jobId} 
                      onClick={() => openJobDetails(run.jobId)}
                      className="flex justify-between items-center p-4 bg-earth-medium/20 border border-border-pink/40 rounded-xl cursor-pointer hover:border-rose-pink/35 hover:bg-earth-medium/40 transition-all duration-200"
                    >
                      <div>
                        <h4 className="font-bold text-cream-ivory text-sm">{run.modelName}</h4>
                        <p className="text-xs text-dusty-rose mt-1">
                          Triggered at {dateStr} {run.score !== null && `| Score: ${run.score.toFixed(1)}`}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${statusColor}`}>
                        {run.status}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </section>

        </div>
      </main>

      <footer className="py-8 border-t border-border-pink/30 bg-earth-dark/40 text-center text-xs text-dusty-rose">
        <p>VibeBench is an <a href="https://github.com/dark7462/VibeBench" target="_blank" rel="noopener noreferrer" className="underline hover:text-rose-pink transition-colors">open-source project</a> licensed under the MIT License. Built with Spring Boot, Redis, and MongoDB.</p>
      </footer>

      {/* MODAL 1: TRIGGER BENCHMARK (Admin only) */}
      {triggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-earth-medium border border-border-pink rounded-3xl w-full max-w-xl p-6 shadow-2xl relative modal-content">
            <button 
              onClick={() => setTriggerModalOpen(false)}
              className="absolute top-4 right-4 text-dusty-rose hover:text-cream-ivory p-1.5 hover:bg-earth-dark/30 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-display text-cream-ivory mb-5 flex items-center gap-2">
              <Cpu className="text-rose-pink w-5 h-5" />
              <span>Launch New Benchmark</span>
            </h2>

            <form onSubmit={handleTriggerRun} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dusty-rose uppercase tracking-wider">Model Name</label>
                <input 
                  type="text" 
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. DeepSeek V4 Flash Free, gpt-4o"
                  className="w-full bg-earth-dark border border-border-pink/60 rounded-xl px-4 py-2.5 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dusty-rose uppercase tracking-wider">API Key (Optional)</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key for premium models"
                  className="w-full bg-earth-dark border border-border-pink/60 rounded-xl px-4 py-2.5 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dusty-rose uppercase tracking-wider">Reference Repo (Optional)</label>
                <input 
                  type="url" 
                  value={refRepo}
                  onChange={(e) => setRefRepo(e.target.value)}
                  placeholder="https://github.com/user/reference-project.git"
                  className="w-full bg-earth-dark border border-border-pink/60 rounded-xl px-4 py-2.5 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dusty-rose uppercase tracking-wider">plan.md / Coding Prompt</label>
                <textarea 
                  rows="6"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="# Requirements&#10;Implement a function/class..."
                  className="w-full bg-earth-dark border border-border-pink/60 rounded-xl px-4 py-2.5 text-sm text-cream-ivory focus:outline-none focus:border-rose-pink font-mono"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button"
                  onClick={() => setTriggerModalOpen(false)}
                  className="px-4 py-2.5 border border-border-pink hover:bg-earth-dark/40 text-cream-ivory rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-rose-pink hover:bg-rose-pink/95 text-earth-dark rounded-xl font-bold font-display transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Launching...' : 'Start Execution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RUN DETAILS & STREAMING LOGS */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-earth-medium border border-border-pink rounded-3xl w-full max-w-5xl h-[80vh] p-6 shadow-2xl relative modal-content flex flex-col overflow-hidden">
            <button 
              onClick={() => setDetailsModalOpen(false)}
              className="absolute top-4 right-4 text-dusty-rose hover:text-cream-ivory p-1.5 hover:bg-earth-dark/30 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-display text-cream-ivory mb-5 shrink-0 flex items-center gap-2" id="details-modal-title">
              <Cpu className="text-rose-pink w-5 h-5" />
              <span>{activeJob ? activeJob.modelName : 'Loading run details...'}</span>
              {activeJob && (
                <span className={`px-2 py-0.5 border text-xs font-bold rounded-md uppercase ${
                  activeJob.status === 'COMPLETED' ? 'bg-sage-green/10 text-sage-green border-border-green' :
                  activeJob.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/25 animate-pulse'
                }`}>
                  {activeJob.status}
                </span>
              )}
            </h2>

            {/* Split panel grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Pane: Details & Circle Gauges */}
              <div className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto pr-1">
                {activeJob ? (
                  <>
                    <div className="bg-earth-dark/30 border border-border-pink/40 p-5 rounded-2xl flex items-center justify-between shadow-inner">
                      <div>
                        <span className="text-xs font-semibold text-dusty-rose uppercase tracking-wider">Overall Score</span>
                        <div className="text-4xl font-extrabold font-display text-rose-pink mt-1">
                          {activeJob.score !== null ? activeJob.score.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right text-xs text-dusty-rose flex flex-col gap-1">
                        <span>Latency: <strong>{activeJob.metrics ? `${(activeJob.metrics.latencyMs / 1000).toFixed(1)}s` : 'N/A'}</strong></span>
                        <span>Cost: <strong>{activeJob.metrics ? `$${activeJob.metrics.costUsd.toFixed(4)}` : 'N/A'}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-cream-ivory uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-sage-green" />
                        <span>Metric Breakdown</span>
                      </h3>
                      
                      {activeJob.metrics ? (
                        <div className="grid grid-cols-2 gap-3">
                          <CircleMetricGauge percent={(activeJob.metrics.functionalAccuracy || 0) * 100} label="Accuracy" />
                          <CircleMetricGauge percent={(activeJob.metrics.codeQuality || 0) * 100} label="Quality" />
                          <CircleMetricGauge percent={(activeJob.metrics.productionRealism || 0) * 100} label="Realism" />
                          <CircleMetricGauge percent={(activeJob.metrics.security || 0) * 100} label="Security" />
                          <div className="col-span-2">
                            <CircleMetricGauge percent={(activeJob.metrics.costLatency || 0) * 100} label="Speed / Cost" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-dusty-rose py-8">Metrics will be available when evaluation finishes.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-dusty-rose text-sm">Loading metrics...</div>
                )}
              </div>

              {/* Right Pane: Logs Terminal */}
              <div className="lg:col-span-7 flex flex-col bg-earth-dark border border-border-pink rounded-2xl overflow-hidden shadow-inner h-full">
                <div className="bg-earth-medium border-b border-border-pink px-4 py-2 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-dusty-rose font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-sage-green" />
                    <span>Sandbox Execution Log Console</span>
                  </span>
                  {(activeJob?.status === 'RUNNING' || activeJob?.status === 'QUEUED') && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  )}
                </div>

                <div className="flex-1 p-4 font-mono text-xs text-green-200/90 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                  {activeJob ? (
                    activeJob.logs ? (
                      <>
                        {activeJob.logs}
                        <div ref={logEndRef} />
                      </>
                    ) : activeJob.errorDetails ? (
                      <span className="text-red-400 font-bold">ERROR:\n{activeJob.errorDetails}</span>
                    ) : (
                      <span className="text-dusty-rose">Initializing container instance... waiting for boot stream.</span>
                    )
                  ) : (
                    'Requesting logs from container socket...'
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
