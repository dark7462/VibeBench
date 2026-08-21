import React, { useState, useEffect } from 'react'
import { RotateCw, CheckCircle2, AlertCircle, ArrowRight, Sparkles, RefreshCw, Bug, Wrench, ShieldAlert } from 'lucide-react'

export default function SelfHealingSection() {
  const [activeStage, setActiveStage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const stages = [
    {
      id: 'generate',
      label: 'GENERATE',
      title: 'Initial Code Generation',
      desc: 'Model drafts the multi-file implementation according to interface specifications.',
      status: 'info',
      badge: 'Synthesizing',
      color: 'border-blue-400 text-blue-600 bg-blue-50'
    },
    {
      id: 'test',
      label: 'TEST',
      title: 'Docker Sandbox Test Suite',
      desc: 'Runs full suite of unit, integration, stress, and security assertion tests.',
      status: 'info',
      badge: 'Executing',
      color: 'border-violet-400 text-violet-600 bg-violet-50'
    },
    {
      id: 'fail',
      label: 'FAIL',
      title: 'Runtime Failure Captured',
      desc: 'Edge-case assertion fails (e.g. concurrency race condition, memory leak, or invalid status code).',
      status: 'error',
      badge: '8/84 Failed',
      color: 'border-red-400 text-red-600 bg-red-50'
    },
    {
      id: 'analyze',
      label: 'ANALYZE',
      title: 'AST & Error Diagnostics',
      desc: 'VibeBench extracts stack traces, AST node diffs, and failing input vectors.',
      status: 'warning',
      badge: 'Parsing Stack',
      color: 'border-amber-400 text-amber-600 bg-amber-50'
    },
    {
      id: 'patch',
      label: 'PATCH',
      title: 'Self-Healing Prompt Feedback',
      desc: 'Model receives the precise failure context and synthesizes a corrective patch in real time.',
      status: 'violet',
      badge: 'Attempt 1/5',
      color: 'border-purple-400 text-purple-600 bg-purple-50'
    },
    {
      id: 'pass',
      label: 'TEST AGAIN & PASS',
      title: 'Validation & Benchmark Lock',
      desc: 'All 84 test cases rerun inside the sandbox. 100% pass rate confirmed.',
      status: 'success',
      badge: '84/84 Passed',
      color: 'border-emerald-400 text-emerald-600 bg-emerald-50'
    }
  ]

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [isAutoPlaying, stages.length])

  return (
    <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/90 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Spot */}
        <div className="ambient-glow-violet -top-20 -right-20 opacity-40 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 border border-black/5">
              <RotateCw className="w-3.5 h-3.5 text-violet-600 animate-spin-slow" />
              <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
                5-Step Self-Healing Loop
              </span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#101114] tracking-tight leading-tight">
              Real engineers debug. <br />
              <span className="text-gradient-vibrant">Great AI models heal.</span>
            </h2>

            <p className="text-base text-[#5F6470] leading-relaxed">
              Evaluating one-shot generation is unrealistic. VibeBench replicates the true developer workflow: when code fails a test, we feed structured diagnostic traces back to the model to measure its self-repair resilience.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/5 hover:bg-black/10 text-[#101114] transition-colors"
              >
                {isAutoPlaying ? 'Pause Animation' : 'Resume Animation'}
              </button>
              <span className="text-xs text-gray-500 font-mono">
                Click any stage below to inspect
              </span>
            </div>
          </div>

          {/* Right: Interactive Flow Diagram */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stages.map((stage, idx) => {
                const isActive = activeStage === idx
                return (
                  <div
                    key={stage.id}
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setActiveStage(idx)
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative ${
                      isActive
                        ? `${stage.color} shadow-lg scale-102 ring-2 ring-black/5 bg-white`
                        : 'border-black/6 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono tracking-wider">
                        0{idx + 1}. {stage.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-black/5">
                        {stage.badge}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#101114] mb-1">
                      {stage.title}
                    </div>

                    <div className="text-[11.5px] text-gray-600 leading-snug">
                      {stage.desc}
                    </div>

                    {/* Active pulse bar */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-current rounded-b-2xl opacity-60" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active Stage Highlight Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-black/5 border border-black/5 text-xs text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
                <span className="font-semibold text-[#101114]">
                  Active Step: {stages[activeStage].title}
                </span>
              </div>
              <span className="text-gray-500 font-mono">
                {activeStage + 1} of {stages.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
