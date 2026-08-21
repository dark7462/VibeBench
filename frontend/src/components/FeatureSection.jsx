import React from 'react'
import { Terminal, Shield, RotateCw, Layers, BarChart3, Database, ArrowUpRight, Cpu, Lock, Zap } from 'lucide-react'

export default function FeatureSection() {
  const features = [
    {
      title: 'Real-Time Logs',
      badge: 'Streaming I/O',
      description: 'Stream execution stdout, compiler diagnostics, and test results live with sub-millisecond latency.',
      icon: Terminal,
      color: 'text-violet-600',
      bgGlow: 'bg-violet-50',
      tag: 'SSE / WebSockets'
    },
    {
      title: 'Isolated Sandboxes',
      badge: 'Hardened Security',
      description: 'Run code in ephemeral Docker containers hardened with gVisor user-space kernel and memory cgroups.',
      icon: Shield,
      color: 'text-emerald-600',
      bgGlow: 'bg-emerald-50',
      tag: 'Zero Egress'
    },
    {
      title: '5-Step Self-Healing',
      badge: 'Autonomous Repair',
      description: 'Feed runtime stack traces and AST diffs back to the model for up to 5 consecutive repair attempts.',
      icon: RotateCw,
      color: 'text-orange-600',
      bgGlow: 'bg-orange-50',
      tag: 'Loop Convergence'
    },
    {
      title: 'Dynamic Runtimes',
      badge: 'Polyglot Engines',
      description: 'Pre-warmed multi-language runtimes for Python 3.11, Node.js 20, Java 17, Go 1.22, and Rust.',
      icon: Layers,
      color: 'text-blue-600',
      bgGlow: 'bg-blue-50',
      tag: 'Multi-Language'
    },
    {
      title: 'Multi-Dimensional Score',
      badge: 'Comprehensive Grading',
      description: 'Grade across Functional Accuracy (35%), Code Quality (20%), Realism (15%), Security (15%), and Cost (15%).',
      icon: BarChart3,
      color: 'text-pink-600',
      bgGlow: 'bg-pink-50',
      tag: '5 Vector Matrix'
    },
    {
      title: 'Redis Leaderboard',
      badge: 'Real-Time Rank',
      description: 'Distributed in-memory caching and atomic sorted sets for instant rank synchronization under heavy load.',
      icon: Database,
      color: 'text-cyan-600',
      bgGlow: 'bg-cyan-50',
      tag: 'Ultra Fast'
    }
  ]

  return (
    <section id="features" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/8 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
            Infrastructure Capabilities
          </span>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#101114] tracking-tight">
          Built for evaluating <br className="hidden sm:inline" />
          AI-generated software.
        </h2>

        <p className="text-base sm:text-lg text-[#5F6470] font-normal leading-relaxed">
          The industry's first evaluation architecture designed around full-stack sandboxing and self-healing resilience.
        </p>
      </div>

      {/* Grid of 6 Distinct Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="glass-card glass-card-hover rounded-3xl p-7 flex flex-col justify-between relative group"
            >
              <div>
                {/* Top icon and tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${f.bgGlow} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/5 text-[#101114]">
                    {f.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-xl text-[#101114] mb-2 tracking-tight">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#5F6470] leading-relaxed">
                  {f.description}
                </p>
              </div>

              {/* Bottom detail pill */}
              <div className="pt-6 mt-6 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                  {f.badge}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#101114] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
