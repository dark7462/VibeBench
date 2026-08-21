import React from 'react'
import { ArrowUpRight, Sparkles, Terminal, Shield } from 'lucide-react'

export default function CTASection({ onOpenBenchmark, onOpenDocs }) {
  return (
    <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl p-10 sm:p-16 overflow-hidden bg-[#101114] text-white shadow-2xl">
        {/* Subtle Ambient Background Gradients inside Dark CTA */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-600/30 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-coral-500/20 filter blur-3xl pointer-events-none" />

        {/* Floating Surreal Glass Hexagon / Orb Element */}
        <div className="hidden lg:block absolute top-1/2 right-16 -translate-y-1/2 pointer-events-none animate-float">
          <div className="w-56 h-56 rounded-full border border-white/20 bg-gradient-to-tr from-white/10 to-transparent backdrop-blur-xl shadow-2xl flex items-center justify-center p-6 text-center">
            <div className="space-y-1">
              <div className="font-mono text-xs text-violet-400 font-bold uppercase tracking-wider">
                VIBEBENCH
              </div>
              <div className="font-display font-extrabold text-xl text-white">
                99.9%
              </div>
              <div className="text-[11px] text-gray-400">
                Sandbox Isolation
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empirical AI Benchmarking</span>
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            Stop guessing which model is better. <br />
            <span className="text-gradient-vibrant">Start benchmarking.</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-300 font-normal leading-relaxed">
            Run real code. Measure real outcomes. Verify that the models you deploy to production will actually write bug-free software.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenBenchmark}
              className="group px-7 py-4 bg-white text-[#101114] hover:bg-gray-100 text-sm font-bold rounded-full shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Run Your First Benchmark</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={onOpenDocs}
              className="px-6 py-4 rounded-full border border-white/20 hover:bg-white/10 text-white text-sm font-semibold transition-all cursor-pointer"
            >
              Read Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
