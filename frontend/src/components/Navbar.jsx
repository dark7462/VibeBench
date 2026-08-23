import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Menu, X, Terminal, Cpu, ShieldCheck, User } from 'lucide-react'

export default function Navbar({ onOpenBenchmark, onOpenDocs, onNavigateSection }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [token, setToken] = useState(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    setToken(localStorage.getItem('vibebench_token'))
    setUserName(localStorage.getItem('vibebench_name') || 'Developer')
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'Evaluator', href: '#evaluator' },
    { name: 'Leaderboard', href: '#leaderboard' },
    { name: 'Docs', onClick: onOpenDocs }
  ]

  const handleNavClick = (link, e) => {
    if (link.onClick) {
      e.preventDefault()
      link.onClick()
      setMobileMenuOpen(false)
    } else if (link.href) {
      if (onNavigateSection) {
        e.preventDefault()
        onNavigateSection(link.href.replace('#', ''))
        setMobileMenuOpen(false)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 py-3.5 sm:py-4">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'glass-card shadow-sm border border-black/5 bg-white/75'
            : 'bg-white/40 backdrop-blur-md border border-white/60 shadow-xs'
        }`}
      >
        {/* Left: Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-[#101114] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            {/* Custom geometric V mark with coral and violet gradient */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L12 20L20 4" stroke="url(#vibe-grad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="vibe-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF6B4A" />
                  <stop offset="0.5" stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-[#101114] tracking-tight">
            VibeBench
          </span>
        </a>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#5F6470]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href || '#'}
              onClick={(e) => handleNavClick(link, e)}
              className="hover:text-[#101114] transition-colors duration-150 relative py-1 cursor-pointer"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {token ? (
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 text-[13px] font-medium text-[#101114] hover:bg-black/5 rounded-full transition-all flex items-center gap-1.5"
            >
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 text-[13.5px] font-medium text-[#101114] hover:bg-black/5 rounded-full transition-all duration-150"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={onOpenBenchmark}
            className="group px-4 py-2 text-[13.5px] font-medium bg-[#101114] hover:bg-[#23262E] text-white rounded-full transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Run Benchmark</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#101114] hover:bg-black/5 rounded-xl transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-card rounded-2xl p-4 shadow-xl border border-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href || '#'}
                onClick={(e) => handleNavClick(link, e)}
                className="px-3 py-2 text-sm font-medium text-[#101114] hover:bg-black/5 rounded-xl transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="h-px bg-black/5 my-1" />
            <div className="flex flex-col gap-2 pt-1">
              {token ? (
                <Link
                  to="/dashboard"
                  className="w-full text-center py-2 text-sm font-medium text-[#101114] bg-black/5 rounded-full"
                >
                  Dashboard ({userName})
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full text-center py-2 text-sm font-medium text-[#101114] bg-black/5 rounded-full"
                >
                  Sign in
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenBenchmark()
                }}
                className="w-full py-2.5 text-sm font-medium bg-[#101114] text-white rounded-full flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Run Benchmark</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
