import React, { useState } from 'react'
import { CheckCircle, Code2, Server, ShieldCheck, DollarSign, ArrowUpRight, BarChart3, HelpCircle } from 'lucide-react'

export default function EvaluationSection() {
  const [activeDimension, setActiveDimension] = useState(0)

  const dimensions = [
    {
      id: 'accuracy',
      title: 'Functional Accuracy',
      weight: '35%',
      color: 'from-orange-400 to-pink-500',
      textColor: 'text-orange-600',
      bgGlow: 'bg-orange-50',
      icon: CheckCircle,
      desc: 'Actual unit, integration, and property-based test pass rate in our sandbox environment.',
      metrics: [
        { label: 'Unit Test Pass Rate', value: '96.2%' },
        { label: 'Edge Case Resilience', value: '92.4%' },
        { label: 'Regression Avoidance', value: '99.0%' }
      ],
      detail: 'Tests are written with strict assertions, mocking external APIs and checking idempotency under concurrency.'
    },
    {
      id: 'quality',
      title: 'Code Quality',
      weight: '20%',
      color: 'from-pink-500 to-violet-500',
      textColor: 'text-pink-600',
      bgGlow: 'bg-pink-50',
      icon: Code2,
      desc: 'Abstract Syntax Tree (AST) complexity, cyclomatic depth, modularity, and language idiomaticity.',
      metrics: [
        { label: 'Cyclomatic Complexity', value: 'Low (< 4)' },
        { label: 'Type Safety & Lint', value: '100%' },
        { label: 'Maintainability Index', value: '88/100' }
      ],
      detail: 'Analyzes formatting, typing completeness, dead code elimination, and semantic cleanliness.'
    },
    {
      id: 'realism',
      title: 'Production Realism',
      weight: '15%',
      color: 'from-violet-500 to-blue-500',
      textColor: 'text-violet-600',
      bgGlow: 'bg-violet-50',
      icon: Server,
      desc: 'Adherence to enterprise architecture: clean layering, controllers, services, database migrations, config hygiene.',
      metrics: [
        { label: 'Layered Separation', value: '94%' },
        { label: 'Config / Env Discipline', value: '98%' },
        { label: 'Graceful Error Handling', value: '91%' }
      ],
      detail: 'Ensures generated code matches how real backend engineering teams structure production repositories.'
    },
    {
      id: 'security',
      title: 'Security & Sandboxing',
      weight: '15%',
      color: 'from-blue-500 to-cyan-400',
      textColor: 'text-blue-600',
      bgGlow: 'bg-blue-50',
      icon: ShieldCheck,
      desc: 'Vulnerability checks for command injection, credential leaks, path traversal, and unsafe deserialization.',
      metrics: [
        { label: 'SAST Audit Pass', value: '99.4%' },
        { label: 'Zero Plaintext Secrets', value: '100%' },
        { label: 'No Shell Injections', value: '100%' }
      ],
      detail: 'Runs static analysis (Semgrep / Bandit / Sonar) to ensure no exploitable code reaches production.'
    },
    {
      id: 'cost-latency',
      title: 'Cost & Latency',
      weight: '15%',
      color: 'from-cyan-400 to-emerald-400',
      textColor: 'text-emerald-600',
      bgGlow: 'bg-emerald-50',
      icon: DollarSign,
      desc: 'Inference latency, sandbox compile duration, and total token expenditure per successful benchmark run.',
      metrics: [
        { label: 'Avg Latency', value: '12.4s' },
        { label: 'Cost / 1K LOC', value: '$0.014' },
        { label: 'Resource Footprint', value: '142 MB' }
      ],
      detail: 'Calculates the true economic ROI of deploying each model into an automated engineering workflow.'
    }
  ]

  return (
    <section id="evaluator" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/8 shadow-xs">
          <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
            Multi-Dimensional Scoring Matrix
          </span>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#101114] tracking-tight">
          One score isn't enough.
        </h2>

        <p className="text-base sm:text-lg text-[#5F6470] font-normal leading-relaxed">
          Coding benchmarks that only test one synthetic regex failure miss what matters. We evaluate five foundational vectors.
        </p>
      </div>

      {/* 5 Glass Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {dimensions.map((dim, idx) => {
          const Icon = dim.icon
          const isSelected = activeDimension === idx
          return (
            <div
              key={dim.id}
              onClick={() => setActiveDimension(idx)}
              className={`glass-card rounded-3xl p-6 relative flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#101114] shadow-2xl bg-white/95 -translate-y-1.5'
                  : 'hover:bg-white/80 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header with weight */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-xl ${dim.bgGlow} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${dim.textColor}`} />
                  </div>
                  <span className="font-mono font-extrabold text-lg text-[#101114]">
                    {dim.weight}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-base text-[#101114] mb-2">
                  {dim.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#5F6470] leading-relaxed mb-4">
                  {dim.desc}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-black/5">
                <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`bg-gradient-to-r ${dim.color} h-full rounded-full transition-all duration-1000`}
                    style={{ width: dim.weight }}
                  />
                </div>

                {/* Sub-metrics */}
                <div className="space-y-1.5">
                  {dim.metrics.map((m, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="font-mono font-semibold text-[#101114]">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
