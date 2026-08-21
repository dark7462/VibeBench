import React, { useState } from 'react'
import { Sparkles, Box, RotateCw, BarChart3, ArrowRight, ShieldCheck } from 'lucide-react'

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      num: '01',
      title: 'Generate',
      subtitle: 'AI Code Synthesis',
      description: 'The AI model receives comprehensive, real-world task specifications, multi-file code context, and environment requirements.',
      icon: Sparkles,
      color: 'text-orange-500',
      badgeBg: 'bg-orange-50',
      borderAccent: 'hover:border-orange-300',
      detail: 'Supports any LLM via standardized JSON schema or OpenAI/Anthropic/Google API proxy.'
    },
    {
      num: '02',
      title: 'Sandbox',
      subtitle: 'Isolated Docker Runtime',
      description: 'The generated codebase is mounted into an ephemeral, hardened Docker container with gVisor kernel isolation and strict resource quotas.',
      icon: Box,
      color: 'text-violet-500',
      badgeBg: 'bg-violet-50',
      borderAccent: 'hover:border-violet-300',
      detail: 'Pre-warmed pools ensure < 150ms startup latency for Python, Node, Java, Go, Rust.'
    },
    {
      num: '03',
      title: 'Heal',
      subtitle: '5-Step Self-Healing Loop',
      description: 'If tests or runtime assertions fail, stack traces, compiler errors, and AST diffs are fed back to the model for up to 5 self-repair iterations.',
      icon: RotateCw,
      color: 'text-blue-500',
      badgeBg: 'bg-blue-50',
      borderAccent: 'hover:border-blue-300',
      detail: 'Tracks convergence rate, patch accuracy, and regression prevention.'
    },
    {
      num: '04',
      title: 'Evaluate',
      subtitle: 'Multi-Dimensional Score',
      description: 'The final outcome is graded across 5 critical vectors: Functional Accuracy, Code Quality, Production Realism, Security, and Cost/Latency.',
      icon: BarChart3,
      color: 'text-emerald-500',
      badgeBg: 'bg-emerald-50',
      borderAccent: 'hover:border-emerald-300',
      detail: 'Produces immutable audit receipts and updates the global Redis leaderboard.'
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/8 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
            The Evaluation Pipeline
          </span>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#101114] tracking-tight">
          From prompt to proof.
        </h2>

        <p className="text-base sm:text-lg text-[#5F6470] font-normal leading-relaxed">
          How VibeBench rigorously evaluates model intelligence under true production conditions.
        </p>
      </div>

      {/* Timeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isSelected = activeStep === idx
          return (
            <div
              key={step.num}
              onClick={() => setActiveStep(idx)}
              className={`glass-card rounded-3xl p-6 sm:p-7 relative transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#101114] shadow-xl bg-white/90 -translate-y-1'
                  : 'hover:bg-white/80 hover:shadow-lg'
              }`}
            >
              {/* Step Number */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-display font-black text-3xl sm:text-4xl text-[#101114]/25 tracking-tighter">
                  {step.num}
                </span>
                <div className={`w-10 h-10 rounded-2xl ${step.badgeBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
              </div>

              {/* Step Title */}
              <div className="space-y-1 mb-3">
                <h3 className="font-display font-bold text-xl text-[#101114] tracking-tight">
                  {step.title}
                </h3>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {step.subtitle}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#5F6470] leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Extra technical detail */}
              <div className="pt-3 border-t border-black/5 text-xs text-gray-500 font-mono">
                {step.detail}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
