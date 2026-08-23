/**
 * BenchmarkModal.jsx
 *
 * This modal is the main entry point for triggering a real benchmark run.
 * It has three stages:
 *
 *  Stage 1: MODEL SELECTION
 *    ├── Tab A: "Free Models"
 *    │     Models fetched live from the backend (/api/v1/models) which runs
 *    │     `opencode models` under the hood — exactly the free models you see
 *    │     in the opencode CLI /model picker. No API key needed.
 *    │
 *    └── Tab B: "API Providers"
 *          Pick a provider (OpenAI, Anthropic, Google, etc.), paste your API key,
 *          then pick a model. Backend receives both modelName + apiKey.
 *
 *  Stage 2: PROMPT INPUT
 *    Enter the coding task you want to benchmark against.
 *
 *  Stage 3: REAL-TIME TERMINAL
 *    After submission, a live terminal opens that streams REAL Docker output
 *    using Server-Sent Events (SSE) from /api/v1/job/{job_id}/stream.
 *    You literally see what's happening inside the container in real time.
 */

import React, { useState, useEffect, useRef } from 'react'
import { X, Play, RotateCw, CheckCircle2, ChevronDown, Terminal, Zap, Key, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : ''

// ─── Sub-component: Free Model Card ─────────────────────────────────────────
function FreeModelCard({ model, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(model)}
      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
        selected
          ? 'border-violet-500 bg-violet-50 shadow-sm'
          : 'border-black/8 bg-white hover:border-violet-300 hover:bg-violet-50/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Selection indicator */}
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? 'border-violet-600 bg-violet-600' : 'border-gray-300 group-hover:border-violet-400'
          }`}>
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <div>
            <div className="text-xs font-bold text-[#101114]">{model.displayName}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{model.description}</div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
          FREE
        </span>
      </div>
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function BenchmarkModal({ isOpen, onClose }) {
  // ── Model Selection State ──────────────────────────────────────────────────
  const [modelTab, setModelTab] = useState('free')          // 'free' | 'api'
  const [freeModels, setFreeModels] = useState([])           // Live from /api/v1/models
  const [apiProviders, setApiProviders] = useState([])       // Provider + model list
  const [modelsLoading, setModelsLoading] = useState(true)   // Loading spinner
  const [modelsError, setModelsError] = useState(null)       // Error message

  // Free tab: which model is selected
  const [selectedFreeModel, setSelectedFreeModel] = useState(null)

  // API tab: which provider, user's key, and which model under that provider
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [selectedApiModel, setSelectedApiModel] = useState(null)

  // ── Prompt State ───────────────────────────────────────────────────────────
  const [promptText, setPromptText] = useState('')

  // ── Job / Terminal State ───────────────────────────────────────────────────
  const [stage, setStage] = useState('config')   // 'config' | 'running'
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState('QUEUED')
  const [terminalLines, setTerminalLines] = useState([])
  const [finalScore, setFinalScore] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const terminalEndRef = useRef(null)
  const eventSourceRef = useRef(null)   // SSE connection handle

  // ── Fetch live models from backend on open ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const fetchModels = async () => {
      setModelsLoading(true)
      setModelsError(null)
      try {
        const res = await fetch(`${API_BASE}/api/v1/models`)
        if (!res.ok) throw new Error('Failed to fetch models')
        const data = await res.json()
        setFreeModels(data.free_models || [])
        setApiProviders(data.api_providers || [])
        // Auto-select first free model
        if (data.free_models?.length > 0 && !selectedFreeModel) {
          setSelectedFreeModel(data.free_models[0])
        }
        // Auto-select first provider
        if (data.api_providers?.length > 0 && !selectedProvider) {
          setSelectedProvider(data.api_providers[0])
          setSelectedApiModel(data.api_providers[0]?.models?.[0] || null)
        }
      } catch (err) {
        setModelsError('Could not load models. Is the backend running?')
      } finally {
        setModelsLoading(false)
      }
    }

    fetchModels()
  }, [isOpen])

  // ── Auto-scroll terminal to bottom as new lines arrive ────────────────────
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLines])

  // ── Clean up SSE connection when modal closes ─────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      eventSourceRef.current?.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── Computed values ────────────────────────────────────────────────────────
  const activeModelId = modelTab === 'free'
    ? selectedFreeModel?.id
    : selectedApiModel?.id

  const activeModelDisplay = modelTab === 'free'
    ? selectedFreeModel?.displayName
    : selectedApiModel?.displayName

  const activeApiKey = modelTab === 'free' ? null : apiKey.trim() || null

  const canSubmit = activeModelId && promptText.trim().length > 10 &&
    (modelTab === 'free' || (activeApiKey && activeApiKey.length > 5))

  // ── SSE Stream Connection ──────────────────────────────────────────────────
  /**
   * Connects to /api/v1/job/{job_id}/stream using the browser's EventSource API.
   * EventSource is a native browser API for Server-Sent Events — a persistent
   * HTTP connection where the server pushes text events to the client one by one.
   *
   * When Docker outputs a line, the backend yields it as an SSE event → browser
   * receives it here → we append it to terminalLines → React re-renders the terminal.
   */
  const startSSEStream = (jobId) => {
    const token = localStorage.getItem('vibebench_token')
    const streamUrl = `${API_BASE}/api/v1/job/${jobId}/stream${token ? `?token=${token}` : ''}`

    // Close any existing SSE connection first
    eventSourceRef.current?.close()

    const es = new EventSource(streamUrl)
    eventSourceRef.current = es

    // Each time Docker produces output, this fires with new log lines
    es.addEventListener('log', (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.chunk) {
          // Split the chunk into individual lines and add each one
          const newLines = payload.chunk.split('\n').filter(Boolean)
          setTerminalLines(prev => [...prev, ...newLines])
        }
        if (payload.status) setJobStatus(payload.status)
      } catch {
        // Non-JSON event, treat as raw text
        if (event.data) setTerminalLines(prev => [...prev, event.data])
      }
    })

    // When the job finishes (completed or failed), this event fires
    es.addEventListener('done', (event) => {
      try {
        const payload = JSON.parse(event.data)
        setJobStatus(payload.status || 'COMPLETED')
        if (payload.score != null) setFinalScore(payload.score)
        setTerminalLines(prev => [
          ...prev,
          '',
          `━━━ Job ${payload.status} ━━━ Score: ${payload.score?.toFixed(1) ?? 'N/A'} / 100`
        ])
      } catch {}
      es.close()
    })

    // Error handler (connection dropped, 404, etc.)
    es.addEventListener('error', () => {
      setTerminalLines(prev => [...prev, '⚠ Connection to log stream lost.'])
      es.close()
    })
  }

  // ── Form Submit ────────────────────────────────────────────────────────────
  const handleLaunch = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setTerminalLines([`> Submitting benchmark for model: ${activeModelDisplay}...`])
    setStage('running')
    setFinalScore(null)
    setJobStatus('QUEUED')

    const token = localStorage.getItem('vibebench_token')

    try {
      const res = await fetch(`${API_BASE}/api/v1/model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          modelName: activeModelId,
          apiKey: activeApiKey,
          promptText: promptText.trim()
        })
      })

      if (!res.ok) {
        const err = await res.json()
        setTerminalLines(prev => [...prev, `✗ Error: ${err.detail || 'Job submission failed'}`])
        setSubmitting(false)
        return
      }

      const data = await res.json()
      const newJobId = data.job_id || data.jobId
      setJobId(newJobId)
      setTerminalLines(prev => [...prev, `> Job ID: ${newJobId} — connecting to Docker stream...`])

      // Start real-time SSE log stream
      startSSEStream(newJobId)
    } catch (err) {
      setTerminalLines(prev => [...prev, `✗ Network error: ${err.message}`])
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    eventSourceRef.current?.close()
    setStage('config')
    setJobId(null)
    setTerminalLines([])
    setFinalScore(null)
    setJobStatus('QUEUED')
    setPromptText('')
  }

  const isDone = jobStatus === 'COMPLETED' || jobStatus === 'FAILED'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl max-w-xl w-full shadow-2xl border border-white/90 relative max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Close Button ─────────────────────────────────────────── */}
        <button
          onClick={() => { eventSourceRef.current?.close(); onClose() }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ════════════════════════════════════════════════════════════
            STAGE 1: CONFIG — Model selection + prompt
            ════════════════════════════════════════════════════════════ */}
        {stage === 'config' && (
          <form onSubmit={handleLaunch} className="flex flex-col overflow-y-auto p-6 sm:p-8 space-y-5">

            {/* Header */}
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#101114] flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#101114]">Run Benchmark</h3>
              </div>
              <p className="text-xs text-[#5F6470]">
                Pick a model, write a coding task, watch Docker execute it live.
              </p>
            </div>

            {/* ── Model Tab Switcher ──────────────────────────────── */}
            <div>
              <div className="flex items-center gap-1 bg-black/[0.04] p-1 rounded-xl border border-black/5 w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setModelTab('free')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modelTab === 'free'
                      ? 'bg-white text-[#101114] shadow-sm border border-black/8'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    Free Models
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelTab('api')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modelTab === 'api'
                      ? 'bg-white text-[#101114] shadow-sm border border-black/8'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-violet-500" />
                    API Providers
                  </span>
                </button>
              </div>

              {/* ── FREE MODELS TAB ───────────────────────────────── */}
              {modelTab === 'free' && (
                <div className="space-y-2">
                  {modelsLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching free models from opencode...</span>
                    </div>
                  )}
                  {modelsError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{modelsError}</span>
                    </div>
                  )}
                  {!modelsLoading && !modelsError && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                          Available Now · No API Key Needed
                        </p>
                        <span className="text-[10px] text-gray-400">{freeModels.length} models</span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {freeModels.map(model => (
                          <FreeModelCard
                            key={model.id}
                            model={model}
                            selected={selectedFreeModel?.id === model.id}
                            onSelect={setSelectedFreeModel}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── API PROVIDERS TAB ─────────────────────────────── */}
              {modelTab === 'api' && (
                <div className="space-y-3">
                  {/* Step 1: Pick a Provider */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      1. Choose Provider
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {apiProviders.map(provider => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => {
                            setSelectedProvider(provider)
                            setSelectedApiModel(provider.models[0])
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            selectedProvider?.id === provider.id
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-black/8 bg-white text-[#101114] hover:border-violet-300'
                          }`}
                        >
                          {provider.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Enter API Key */}
                  {selectedProvider && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        2. {selectedProvider.name} API Key
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={selectedProvider.keyPlaceholder}
                        className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] border border-black/10 focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono"
                      />
                      <p className="text-[10px] text-gray-400">{selectedProvider.keyHint}</p>
                    </div>
                  )}

                  {/* Step 3: Pick a Model */}
                  {selectedProvider && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        3. Select Model
                      </label>
                      <div className="relative">
                        <select
                          value={selectedApiModel?.id || ''}
                          onChange={e => {
                            const m = selectedProvider.models.find(m => m.id === e.target.value)
                            setSelectedApiModel(m || null)
                          }}
                          className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] border border-black/10 focus:outline-none focus:ring-2 focus:ring-violet-300 font-medium appearance-none pr-8"
                        >
                          {selectedProvider.models.map(m => (
                            <option key={m.id} value={m.id}>{m.displayName}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Prompt Input ───────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Coding Task / Benchmark Prompt
              </label>
              <textarea
                rows={4}
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder="Describe the coding challenge. E.g.: Implement a sliding window rate limiter in Python with pytest tests..."
                className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] placeholder-gray-400 border border-black/10 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                required
              />
              <p className="text-[10px] text-gray-400">
                The model will generate code + tests, then Docker runs and evaluates them.
              </p>
            </div>

            {/* ── Selected Model Summary ──────────────────────────── */}
            {activeModelDisplay && (
              <div className="p-3 rounded-xl bg-black/[0.03] border border-black/5 text-xs flex items-center justify-between">
                <span className="text-gray-600">Running with:</span>
                <span className="font-bold text-[#101114]">{activeModelDisplay}</span>
              </div>
            )}

            {/* ── Submit Button ───────────────────────────────────── */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full py-3 bg-[#101114] hover:bg-[#23262E] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Docker Benchmark</span>
            </button>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════
            STAGE 2: RUNNING — Real-time Docker terminal via SSE
            ════════════════════════════════════════════════════════════ */}
        {stage === 'running' && (
          <div className="flex flex-col h-full">
            {/* Terminal Header */}
            <div className="px-5 pt-5 pb-3 border-b border-black/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-600" />
                <div>
                  <div className="text-xs font-bold text-[#101114]">
                    Docker Terminal — {activeModelDisplay}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Job #{jobId} · {jobStatus}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Live pulse indicator */}
                {!isDone && (
                  <span className="flex items-center gap-1.5 text-[10px] text-violet-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                    LIVE
                  </span>
                )}
                {isDone && finalScore != null && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Score: {finalScore.toFixed(1)} / 100
                  </span>
                )}
                {isDone && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    jobStatus === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {jobStatus}
                  </span>
                )}
              </div>
            </div>

            {/* ── Real Terminal Output ─────────────────────────────
                This div shows lines streamed from Docker via SSE.
                Each line is exactly what Docker outputs to stdout/stderr.
                We just render them — no fake animations, no mock data.
            ─────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-[#0d0d10] font-mono text-[11.5px] leading-relaxed p-4 space-y-0.5 min-h-[320px]">
              {terminalLines.map((line, i) => {
                // Color code lines based on content
                let cls = 'text-gray-300'
                if (line.includes('✅') || line.includes('SUCCESS') || line.includes('passed'))
                  cls = 'text-emerald-400 font-semibold'
                else if (line.includes('❌') || line.includes('FAILED') || line.includes('Error') || line.includes('error'))
                  cls = 'text-red-400'
                else if (line.includes('⚠') || line.includes('WARNING') || line.includes('failed'))
                  cls = 'text-amber-300'
                else if (line.includes('🔄') || line.includes('SELF-HEALING') || line.includes('healing'))
                  cls = 'text-violet-400 font-semibold'
                else if (line.includes('🚀') || line.includes('📦') || line.includes('⚙️') || line.includes('==='))
                  cls = 'text-blue-300'
                else if (line.startsWith('>') || line.startsWith('━'))
                  cls = 'text-violet-300'

                return (
                  <div key={i} className={`${cls} whitespace-pre-wrap break-all`}>
                    {line || '\u00A0'}
                  </div>
                )
              })}

              {/* Blinking cursor when running */}
              {!isDone && (
                <div className="flex items-center gap-1 text-violet-400 pt-1">
                  <span className="w-2 h-3 bg-violet-400 animate-pulse inline-block" />
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>

            {/* ── Terminal Footer Actions ──────────────────────────── */}
            <div className="px-5 py-4 border-t border-black/5 flex items-center gap-3 flex-shrink-0 bg-white/80">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-xs font-semibold text-[#101114] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Benchmark
              </button>

              {isDone && (
                <a
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101114] hover:bg-[#23262E] text-white text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  View Full Results
                </a>
              )}

              <div className="ml-auto text-[10px] text-gray-400 font-mono">
                {isDone ? 'Job complete' : 'Streaming Docker output...'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
