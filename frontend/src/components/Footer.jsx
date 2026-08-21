import React from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function Footer({ onOpenBenchmark, onOpenDocs, onNavigateSection }) {
  return (
    <footer className="border-t border-black/8 bg-white/40 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-black/5">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#101114] flex items-center justify-center shadow-xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L12 20L20 4" stroke="url(#footer-grad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="footer-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF6B4A" />
                      <stop offset="0.5" stopColor="#8B5CF6" />
                      <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="font-display font-extrabold text-xl text-[#101114] tracking-tight">
                VibeBench
              </span>
            </div>

            <p className="text-sm text-[#5F6470] max-w-sm font-normal leading-relaxed">
              The premier evaluation platform for AI coding models. Running untrusted code in hardened Docker sandboxes with autonomous self-healing.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
              Product
            </div>
            <ul className="space-y-2 text-sm text-[#5F6470] font-medium">
              <li>
                <a href="#features" onClick={() => onNavigateSection && onNavigateSection('features')} className="hover:text-[#101114] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={() => onNavigateSection && onNavigateSection('how-it-works')} className="hover:text-[#101114] transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#evaluator" onClick={() => onNavigateSection && onNavigateSection('evaluator')} className="hover:text-[#101114] transition-colors">
                  Scoring Matrix
                </a>
              </li>
              <li>
                <a href="#leaderboard" onClick={() => onNavigateSection && onNavigateSection('leaderboard')} className="hover:text-[#101114] transition-colors">
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
              Resources
            </div>
            <ul className="space-y-2 text-sm text-[#5F6470] font-medium">
              <li>
                <button onClick={onOpenDocs} className="hover:text-[#101114] transition-colors cursor-pointer">
                  Documentation
                </button>
              </li>
              <li>
                <button onClick={onOpenBenchmark} className="hover:text-[#101114] transition-colors cursor-pointer">
                  Run Benchmark
                </button>
              </li>
              <li>
                <a href="/login" className="hover:text-[#101114] transition-colors">
                  Sign In
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-[#101114] transition-colors">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
              Architecture
            </div>
            <div className="space-y-2 text-xs text-[#5F6470] font-mono leading-relaxed">
              <div>• gVisor Ephemeral Sandboxes</div>
              <div>• 5-Step AST Self-Healing Engine</div>
              <div>• Redis Sorted Sets Cache</div>
              <div>• Spring Boot Core Orchestrator</div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © 2026 VibeBench. Built for evaluating AI-generated software.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Security</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
