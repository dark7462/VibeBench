import React, { useState } from 'react'
import { X, Terminal, Copy, Check, BookOpen, Code, Server, Shield } from 'lucide-react'

export default function DocsModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const curlCommand = `curl -sSL https://vibebench.ai/install.sh | bash`

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-white/90 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <h3 className="font-display font-extrabold text-2xl text-[#101114]">
              VibeBench Developer Docs
            </h3>
          </div>
          <p className="text-xs text-[#5F6470]">
            Evaluate AI coding models locally or against the VibeBench cloud sandbox cluster.
          </p>
        </div>

        <div className="space-y-6 text-xs text-[#101114]">
          {/* CLI Quickstart */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
              1. Install the CLI
            </div>
            <div className="glass-dark rounded-xl p-3 flex items-center justify-between font-mono text-gray-200">
              <span className="text-xs">{curlCommand}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Copy command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Running Benchmark via CLI */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
              2. Run a Benchmark
            </div>
            <div className="glass-dark rounded-xl p-3 font-mono text-gray-300 space-y-1">
              <div className="text-gray-500"># Run evaluation on standard test suite</div>
              <div className="text-white">&gt; vibe run --model=gpt-4o --suite=concurrency-stress</div>
              <div className="text-gray-500 pt-1"># Test against custom local repository</div>
              <div className="text-white">&gt; vibe test ./my-repo --sandbox=docker</div>
            </div>
          </div>

          {/* Scoring Formula */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
              3. Scoring Weight Formula
            </div>
            <div className="p-4 rounded-xl bg-black/5 font-mono space-y-1 leading-relaxed">
              <div>VibeScore = (0.35 * Accuracy) +</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.20 * CodeQuality) +</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.15 * Realism) +</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.15 * Security) +</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.15 * (100 - CostLatencyPenalty))</div>
            </div>
          </div>

          {/* REST API Endpoints */}
          <div className="space-y-2">
            <div className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
              4. Core API Endpoints
            </div>
            <div className="space-y-1.5 font-mono">
              <div className="p-2 rounded-lg bg-black/5 flex items-center justify-between">
                <span className="text-emerald-700 font-bold">GET</span>
                <span className="text-gray-700">/api/v1/leaderboard</span>
                <span className="text-gray-400 text-[10px]">Global rank cache</span>
              </div>
              <div className="p-2 rounded-lg bg-black/5 flex items-center justify-between">
                <span className="text-blue-700 font-bold">POST</span>
                <span className="text-gray-700">/api/v1/model</span>
                <span className="text-gray-400 text-[10px]">Enqueue benchmark job</span>
              </div>
              <div className="p-2 rounded-lg bg-black/5 flex items-center justify-between">
                <span className="text-emerald-700 font-bold">GET</span>
                <span className="text-gray-700">/api/v1/stats</span>
                <span className="text-gray-400 text-[10px]">Real-time system telemetry</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-black/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#101114] text-white font-semibold text-xs hover:bg-black/80 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
