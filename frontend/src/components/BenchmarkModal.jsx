import React, { useState } from 'react'
import { X, Play, RotateCw, CheckCircle2, Shield, Box, Sparkles, Terminal, ArrowUpRight } from 'lucide-react'
import { api, MOCK_SCENARIOS } from '../lib/api'

export default function BenchmarkModal({ isOpen, onClose }) {
  const [modelName, setModelName] = useState('GPT-4o')
  const [scenarioId, setScenarioId] = useState(MOCK_SCENARIOS[0].id)
  const [apiKey, setApiKey] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useHostedPool, setUseHostedPool] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [jobStage, setJobStage] = useState(0)

  if (!isOpen) return null

  const handleLaunch = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setJobStage(0)

    const payload = {
      modelName,
      scenarioId,
      apiKey: useHostedPool ? 'HOSTED_VIBEBENCH_SANDBOX' : apiKey,
      promptText: customPrompt || MOCK_SCENARIOS.find(s => s.id === scenarioId)?.prompt
    }

    const res = await api.triggerBenchmark(payload)
    setActiveJob(res)

    // Progress simulation
    const timer1 = setTimeout(() => setJobStage(1), 800)
    const timer2 = setTimeout(() => setJobStage(2), 1800)
    const timer3 = setTimeout(() => setJobStage(3), 2800)
    const timer4 = setTimeout(() => {
      setJobStage(4)
      setSubmitting(false)
    }, 3800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }

  const handleReset = () => {
    setActiveJob(null)
    setJobStage(0)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white/90 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!activeJob ? (
          <form onSubmit={handleLaunch} className="space-y-5">
            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#101114] flex items-center justify-center text-white text-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#101114]">
                  Run Benchmark
                </h3>
              </div>
              <p className="text-xs text-[#5F6470]">
                Execute untrusted AI code inside an isolated Docker sandbox with self-healing feedback.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Target AI Model
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10 font-medium"
              >
                <option value="GPT-4o">GPT-4o (OpenAI)</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Google)</option>
                <option value="DeepSeek V3">DeepSeek V3 (DeepSeek)</option>
                <option value="Qwen 2.5 Coder 32B">Qwen 2.5 Coder 32B (Alibaba)</option>
                <option value="Llama 3.3 70B">Llama 3.3 70B (Meta)</option>
              </select>
            </div>

            {/* Benchmark Suite Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Benchmark Problem Suite
              </label>
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10 font-medium"
              >
                {MOCK_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title} ({sc.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Task or Override Prompt */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Task Specification (Optional Override)</span>
                <span className="text-[10px] text-gray-400">Default used if blank</span>
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom requirement or leave blank for official benchmark dataset..."
                className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-[#101114] placeholder-gray-400 border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            {/* Hosted Sandbox Pool Toggle */}
            <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-semibold text-[#101114]">
                    Use Hosted Sandbox Pool
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Runs on VibeBench pre-warmed gVisor clusters (Free Tier)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useHostedPool}
                onChange={(e) => setUseHostedPool(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
            </div>

            {!useHostedPool && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Model Provider API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl text-xs text-[#101114] border border-black/10 focus:outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#101114] hover:bg-[#23262E] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Isolated Sandbox Benchmark</span>
            </button>
          </form>
        ) : (
          /* Live Progress & Results State */
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold font-mono text-violet-600 uppercase">
                  BENCHMARK JOB #{activeJob.id}
                </span>
                <h3 className="font-display font-bold text-lg text-[#101114]">
                  Evaluating {modelName}
                </h3>
              </div>
              {jobStage === 4 ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finished</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running...</span>
                </span>
              )}
            </div>

            {/* Stages Step Indicator */}
            <div className="space-y-2 text-xs font-mono bg-black/90 text-gray-200 p-4 rounded-2xl">
              <div className={jobStage >= 1 ? 'text-emerald-400' : 'text-gray-500'}>
                {jobStage >= 1 ? '✓' : '◌'} 1. Ephemeral Docker Sandbox Provisioned (ubuntu:22.04)
              </div>
              <div className={jobStage >= 2 ? 'text-emerald-400' : 'text-gray-500'}>
                {jobStage >= 2 ? '✓' : '◌'} 2. Multi-file code injected &amp; AST validated
              </div>
              <div className={jobStage >= 3 ? 'text-emerald-400' : 'text-gray-500'}>
                {jobStage >= 3 ? '✓' : '◌'} 3. Test harness executed + Self-healing loop converged
              </div>
              <div className={jobStage >= 4 ? 'text-emerald-400' : 'text-gray-500'}>
                {jobStage >= 4 ? '✓' : '◌'} 4. Multi-dimensional scores tallied &amp; Redis updated
              </div>
            </div>

            {jobStage === 4 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Overall Vibe Score: 94.6 / 100</span>
                  <span className="font-mono text-emerald-700">Rank: #01</span>
                </div>
                <div className="text-emerald-800 leading-snug">
                  All 84 unit tests passed after 1 self-healing repair iteration. Execution time: 3.4s.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="w-1/2 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-xs font-semibold text-[#101114] transition-colors"
              >
                Run Another Test
              </button>
              <a
                href="/dashboard"
                className="w-1/2 py-2.5 rounded-xl bg-[#101114] hover:bg-[#23262E] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>View Full Telemetry</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
