import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ChevronDown, Zap, Shield, Box, Code2, Users, CheckCircle2, Terminal, ExternalLink } from 'lucide-react'
import HeroScene from './HeroScene'

export default function Hero({ onOpenBenchmark, onNavigateSection }) {
  const [typedLines, setTypedLines] = useState([])
  const [cursorVisible, setCursorVisible] = useState(true)

  // Terminal log streaming simulation
  const fullLog = [
    { text: '> Booting sandbox (ubuntu:22.04)', color: 'text-gray-300' },
    { text: '> Installing toolchain...', color: 'text-gray-300' },
    { text: '  ✓ Python 3.11.4', color: 'text-emerald-400' },
    { text: '  ✓ Node.js 20.x', color: 'text-emerald-400' },
    { text: '  ✓ OpenJDK 17', color: 'text-emerald-400' },
    { text: '> Running unit tests...', color: 'text-gray-300' },
    { text: '> Test cases: 84 | Passed: 76 | Failed: 8', color: 'text-amber-300' },
    { text: '> Self-healing triggered...', color: 'text-violet-400' },
    { text: '> Attempt 3/5 in progress...', color: 'text-cyan-400' }
  ]

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < fullLog.length) {
        setTypedLines((prev) => [...prev, fullLog[currentIndex]])
        currentIndex++
      } else {
        // Reset after a pause to loop nicely
        setTimeout(() => {
          setTypedLines([])
          currentIndex = 0
        }, 6000)
      }
    }, 450)

    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)

    return () => {
      clearInterval(interval)
      clearInterval(cursorInterval)
    }
  }, [])

  return (
    <section className="relative min-h-screen pt-28 pb-16 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col justify-between">
      {/* 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
        {/* Left Column (~45% on desktop: 5.5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center z-20 space-y-6 sm:space-y-7">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/8 shadow-xs backdrop-blur-md w-fit">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-[#101114] uppercase">
              AI Model Coding Benchmark
            </span>
          </div>

          {/* Enormous Editorial Typography with Accent Dots */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-display font-extrabold text-[44px] sm:text-[64px] lg:text-[72px] leading-[1.03] tracking-[-0.035em] text-[#101114]">
              <div className="inline-block hover:translate-x-1 transition-transform duration-200">
                Benchmark<span className="text-[#FF6B4A]">.</span>
              </div>
              <br />
              <div className="inline-block hover:translate-x-1 transition-transform duration-200">
                Evaluate<span className="text-[#8B5CF6]">.</span>
              </div>
              <br />
              <div className="inline-block hover:translate-x-1 transition-transform duration-200">
                Trust AI Code<span className="text-[#3B82F6]">.</span>
              </div>
            </h1>
          </div>

          {/* Subheading / Description */}
          <p className="text-base sm:text-[17px] leading-relaxed text-[#5F6470] max-w-lg font-normal">
            VibeBench runs real-world coding tasks in isolated Docker sandboxes,
            uses a self-healing loop to fix failures, and scores AI models across
            5 critical dimensions.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              onClick={onOpenBenchmark}
              className="group px-6 py-3.5 bg-[#101114] hover:bg-[#23262E] text-white text-sm font-semibold rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span>Run Your First Benchmark</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => onNavigateSection && onNavigateSection('leaderboard')}
              className="px-5 py-3.5 glass-card glass-card-hover text-[#101114] text-sm font-semibold rounded-full cursor-pointer"
            >
              Explore Leaderboard
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Developer"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Developer"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                alt="Developer"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                alt="Developer"
              />
            </div>
            <span className="text-xs text-[#5F6470] font-medium leading-snug">
              Trusted by developers &amp; researchers <br className="hidden sm:inline" />
              building the future with AI
            </span>
          </div>

          {/* Bottom Left Live Execution Terminal Card */}
          <div className="pt-3">
            <div className="glass-terminal rounded-2xl p-4 text-xs font-mono max-w-md shadow-2xl border border-white/10 relative overflow-hidden group">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 text-gray-400">
                <div className="flex items-center gap-2 font-sans text-[11px] font-semibold tracking-wider text-gray-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE EXECUTION LOG</span>
                </div>
                <button
                  onClick={() => onNavigateSection && onNavigateSection('live-execution')}
                  className="hover:text-white transition-colors"
                  title="Expand Interactive Sandbox"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Streaming Output */}
              <div className="space-y-1 min-h-[140px] text-[11.5px] leading-relaxed">
                {typedLines.map((line, i) => (
                  <div key={i} className={`${line.color} animate-in fade-in duration-150`}>
                    {line.text}
                  </div>
                ))}
                <span className={`inline-block w-1.5 h-3.5 bg-emerald-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (~55% on desktop: 7 cols) */}
        <div className="lg:col-span-7 relative flex justify-center items-center">
          <HeroScene />
        </div>
      </div>

      {/* Bottom Floating Pill: Top 3 Models & Metrics Strip */}
      <div className="mt-12 sm:mt-16 w-full">
        <div className="glass-card rounded-3xl p-4 sm:p-6 shadow-xl border border-white/90">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Top 3 Models Column */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-black/8 pb-4 lg:pb-0 lg:pr-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Top 3 Models
                </span>
                <button
                  onClick={() => onNavigateSection && onNavigateSection('leaderboard')}
                  className="text-[11.5px] font-medium text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View full leaderboard</span>
                  <span>&rarr;</span>
                </button>
              </div>

              <div className="space-y-2">
                {/* 01 GPT-4o */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                      01
                    </div>
                    <span className="text-xs font-semibold text-[#101114]">GPT-4o</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-600">92.46</span>
                </div>

                {/* 02 Claude 3.5 Sonnet */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                      02
                    </div>
                    <span className="text-xs font-semibold text-[#101114]">Claude 3.5 Sonnet</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-600">89.31</span>
                </div>

                {/* 03 Gemini 1.5 Pro */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl hover:bg-black/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">
                      03
                    </div>
                    <span className="text-xs font-semibold text-[#101114]">Gemini 1.5 Pro</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-violet-600">86.72</span>
                </div>
              </div>
            </div>

            {/* Metrics Strip */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
              {/* Metric 1 */}
              <div className="space-y-1 pl-2">
                <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-gray-700 mb-2">
                  <Box className="w-4 h-4" />
                </div>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#101114] tracking-tight">
                  1,248+
                </div>
                <div className="text-xs font-medium text-[#5F6470]">
                  Benchmarks Run
                </div>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1 pl-2">
                <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-gray-700 mb-2">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#101114] tracking-tight">
                  328+
                </div>
                <div className="text-xs font-medium text-[#5F6470]">
                  Coding Problems
                </div>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1 pl-2">
                <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-gray-700 mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#101114] tracking-tight">
                  87+
                </div>
                <div className="text-xs font-medium text-[#5F6470]">
                  Models Evaluated
                </div>
              </div>

              {/* Metric 4 */}
              <div className="space-y-1 pl-2">
                <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-gray-700 mb-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#101114] tracking-tight text-emerald-600">
                  99.9%
                </div>
                <div className="text-xs font-medium text-[#5F6470]">
                  Sandbox Isolation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="mt-8 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        onClick={() => onNavigateSection && onNavigateSection('live-execution')}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase font-mono">
          SCROLL TO EXPLORE
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  )
}
