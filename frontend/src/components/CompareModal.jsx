import React from 'react'
import { X, Trophy, CheckCircle, Zap, Shield, DollarSign, Clock, Cpu } from 'lucide-react'

export default function CompareModal({ isOpen, onClose, models = [] }) {
  if (!isOpen) return null

  const displayModels = models.length > 0 ? models.slice(0, 3) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-white/90 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-extrabold text-2xl text-[#101114]">
              Model Comparison Matrix
            </h3>
          </div>
          <p className="text-xs text-[#5F6470]">
            Empirical benchmark metrics evaluated inside identical gVisor Docker sandboxes.
          </p>
        </div>

        {/* Side-by-side columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayModels.map((m, idx) => {
            const isWinner = idx === 0
            return (
              <div
                key={m.name}
                className={`p-5 rounded-2xl border transition-all ${
                  isWinner
                    ? 'border-amber-300 bg-amber-50/40 shadow-md ring-1 ring-amber-300'
                    : 'border-black/8 bg-white/70 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold font-mono text-gray-400">
                    RANK #{m.rank}
                  </span>
                  {isWinner && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      Top Performer
                    </span>
                  )}
                </div>

                <div className="font-display font-bold text-lg text-[#101114] mb-0.5">
                  {m.name}
                </div>
                <div className="text-xs text-gray-500 mb-4">{m.provider}</div>

                {/* Score */}
                <div className="p-3 rounded-xl bg-black/5 mb-4 text-center">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase">
                    VibeBench Score
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-violet-600">
                    {m.score}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-gray-500">Test Accuracy</span>
                    <span className="font-mono font-bold text-[#101114]">{m.accuracy}%</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-gray-500">Latency</span>
                    <span className="font-mono font-bold text-[#101114]">{m.latency}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-gray-500">Cost / 1K LOC</span>
                    <span className="font-mono font-bold text-[#101114]">{m.cost}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-gray-500">Self-Healing Pass</span>
                    <span className="font-mono font-bold text-violet-600">{m.selfHealing}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Security Audit</span>
                    <span className="font-mono font-bold text-emerald-600">{m.security}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-gray-500">
          <span>All tests run with 512MB RAM and isolated network bounds</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#101114] text-white font-semibold hover:bg-black/80 transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  )
}
