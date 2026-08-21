import React, { useState, useEffect, useRef } from 'react'
import { RotateCw, Shield, Box, Gauge, Code, Layers } from 'lucide-react'

export default function HeroScene() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    let animationFrameId
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Normalized between -1 and 1
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      targetX = Math.max(-1, Math.min(1, x))
      targetY = Math.max(-1, Math.min(1, y))
    }

    const handleMouseLeave = () => {
      targetX = 0
      targetY = 0
      setIsHovered(false)
    }

    const handleMouseEnter = () => {
      setIsHovered(true)
    }

    const updateParallax = () => {
      // Spring smoothing
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      setMousePos({ x: currentX, y: currentY })
      animationFrameId = requestAnimationFrame(updateParallax)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    animationFrameId = requestAnimationFrame(updateParallax)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Depth offsets
  const sphereX = mousePos.x * 24
  const sphereY = mousePos.y * 18
  const mountainX = mousePos.x * 12
  const mountainY = mousePos.y * 10
  const platformX = mousePos.x * 8
  const platformY = mousePos.y * 6
  const cardsX = mousePos.x * 32
  const cardsY = mousePos.y * 22

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] flex items-center justify-center select-none overflow-visible"
      style={{ perspective: 1200 }}
    >
      {/* Ambient background glow behind sphere */}
      <div
        className="absolute top-12 right-20 w-72 h-72 rounded-full pointer-events-none opacity-60 filter blur-3xl transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(255, 107, 74, 0.2) 50%, transparent 70%)',
          transform: `translate3d(${sphereX * 1.2}px, ${sphereY * 1.2}px, 0)`
        }}
      />

      {/* 1. LAYER: Iridescent Glass Sphere */}
      <div
        className="absolute top-4 sm:top-8 right-12 sm:right-24 z-20 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${sphereX}px, ${sphereY}px, 40px)`
        }}
      >
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full flex items-center justify-center animate-float">
          {/* Glass Sphere Body with Iridescent Refraction */}
          <div
            className="absolute inset-0 rounded-full shadow-2xl backdrop-blur-xs"
            style={{
              background: `
                radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.25) 25%, rgba(230, 240, 255, 0.15) 50%, rgba(139, 92, 246, 0.25) 75%, rgba(59, 130, 246, 0.35) 100%)
              `,
              border: '1.5px solid rgba(255, 255, 255, 0.8)',
              boxShadow: `
                inset 0 10px 25px rgba(255, 255, 255, 0.9),
                inset 0 -15px 30px rgba(139, 92, 246, 0.35),
                inset -10px 0 20px rgba(59, 130, 246, 0.25),
                0 25px 50px -12px rgba(139, 92, 246, 0.25),
                0 10px 20px -5px rgba(0, 0, 0, 0.08)
              `
            }}
          />

          {/* Rainbow Specular Highlight */}
          <div
            className="absolute top-4 left-8 w-16 h-10 rounded-full opacity-80 filter blur-[1px] transform -rotate-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,200,220,0.6) 50%, rgba(180,220,255,0.3) 100%)'
            }}
          />
          <div
            className="absolute bottom-6 right-10 w-20 h-8 rounded-full opacity-60 filter blur-xs transform rotate-20"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(255,107,74,0.4) 100%)'
            }}
          />

          {/* Prompt text inside sphere: >_ vibe run */}
          <div className="relative z-10 px-3.5 py-1.5 rounded-lg bg-black/35 backdrop-blur-md border border-white/30 text-white font-mono text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 shadow-lg">
            <span className="text-violet-300">&gt;_</span>
            <span>vibe run</span>
            <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. LAYER: Dark Mountain Island & Mist Clouds */}
      <div
        className="absolute top-36 sm:top-40 right-14 sm:right-28 z-15 pointer-events-none transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${mountainX}px, ${mountainY}px, 20px)`
        }}
      >
        <div className="relative w-64 sm:w-80 h-64">
          {/* Mountain Silhouette with Shading & Snow Caps */}
          <svg viewBox="0 0 300 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
            {/* Back Mountain Ridge */}
            <path
              d="M60 220 L130 90 L170 140 L210 80 L260 220 Z"
              fill="url(#mountainGrad2)"
              opacity="0.85"
            />
            {/* Main Jagged Peak */}
            <path
              d="M90 220 L160 50 L200 130 L240 220 Z"
              fill="url(#mountainGrad1)"
            />
            {/* Rock facets & snow highlights */}
            <path
              d="M160 50 L145 95 L160 130 L160 50 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />
            <path
              d="M160 50 L175 105 L160 130 L160 50 Z"
              fill="rgba(20, 24, 33, 0.4)"
            />
            <path
              d="M210 80 L200 120 L215 140 L210 80 Z"
              fill="rgba(255, 255, 255, 0.35)"
            />
            <path
              d="M130 90 L120 130 L135 150 L130 90 Z"
              fill="rgba(255, 255, 255, 0.3)"
            />
            <defs>
              <linearGradient id="mountainGrad1" x1="160" y1="50" x2="160" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#374151" />
                <stop offset="0.4" stopColor="#1F2937" />
                <stop offset="1" stopColor="#111827" />
              </linearGradient>
              <linearGradient id="mountainGrad2" x1="150" y1="80" x2="150" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4B5563" />
                <stop offset="0.6" stopColor="#374151" />
                <stop offset="1" stopColor="#1F2937" />
              </linearGradient>
            </defs>
          </svg>

          {/* Realistic Swirling Mist / Clouds at Base */}
          <div
            className="absolute bottom-4 -left-10 w-44 h-16 rounded-full bg-white/70 filter blur-xl opacity-90 animate-pulse-subtle"
          />
          <div
            className="absolute bottom-2 right-0 w-48 h-20 rounded-full bg-white/75 filter blur-lg opacity-85"
          />
          <div
            className="absolute bottom-8 left-12 w-36 h-12 rounded-full bg-gradient-to-r from-violet-100/60 to-blue-100/60 filter blur-md opacity-80"
          />
        </div>
      </div>

      {/* 3. LAYER: Floating Crystalline Platform */}
      <div
        className="absolute bottom-16 sm:bottom-20 right-8 sm:right-16 z-10 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${platformX}px, ${platformY}px, 0px) rotateX(58deg) rotateZ(-18deg)`
        }}
      >
        <div
          className="w-[360px] sm:w-[460px] h-[280px] sm:h-[340px] rounded-3xl backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(240, 245, 255, 0.4) 50%, rgba(220, 230, 250, 0.25) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `
              0 30px 60px -15px rgba(0, 0, 0, 0.15),
              inset 0 2px 4px rgba(255, 255, 255, 0.95),
              inset 0 -10px 20px rgba(139, 92, 246, 0.15)
            `
          }}
        >
          {/* Platform grid etching */}
          <div className="w-full h-full opacity-30 bg-noise rounded-3xl" />
        </div>
      </div>

      {/* 4. LAYER: Translucent Floating Glass Cubes with Symbols */}
      <div
        className="absolute bottom-28 sm:bottom-32 right-16 sm:right-28 z-25 flex items-center gap-4 sm:gap-6 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${platformX * 1.4}px, ${platformY * 1.4}px, 50px)`
        }}
      >
        {/* Cube 1: Code brackets </> */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-3 flex flex-col items-center justify-center animate-float"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
            animationDelay: '0s'
          }}
        >
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#101114] tracking-tighter">&lt;/&gt;</span>
          <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Tests</span>
        </div>

        {/* Cube 2: Speedometer / Latency */}
        <div
          className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl p-3 flex flex-col items-center justify-center animate-float-reverse"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 40px -8px rgba(139, 92, 246, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
            animationDelay: '0.8s'
          }}
        >
          <Gauge className="w-7 h-7 sm:w-8 sm:h-8 text-violet-600 stroke-[2.2]" />
          <span className="text-[10px] font-bold text-gray-700 mt-1 font-mono">11.8s</span>
        </div>

        {/* Cube 3: Code Braces & Checkmark */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-3 flex flex-col items-center justify-center animate-float"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
            animationDelay: '1.6s'
          }}
        >
          <span className="font-mono text-xl sm:text-2xl font-bold text-blue-600">&#123;&#125;</span>
          <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest mt-0.5">✓ 99.9%</span>
        </div>
      </div>

      {/* 5. FLOATING GLASS CARD: SELF-HEALING (Top Left of Scene) */}
      <div
        className="absolute top-10 sm:top-14 left-4 sm:left-12 z-30 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${-cardsX * 0.7}px, ${-cardsY * 0.7}px, 70px)`
        }}
      >
        <div className="glass-card rounded-2xl p-4 sm:p-5 w-48 sm:w-56 shadow-lg border border-white/80 animate-float">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            <span>SELF-HEALING</span>
            <span className="text-violet-600 font-mono">3/5</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-[#101114]">
            Attempt 3/5
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="relative w-5 h-5 flex items-center justify-center">
              <RotateCw className="w-4 h-4 text-violet-600 animate-spin" />
            </div>
            <span className="text-[11.5px] text-gray-600 font-medium">Fixing test failures...</span>
          </div>
          <div className="mt-2.5 w-full bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-coral-500 h-full w-3/5 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* 6. FLOATING GLASS CARD: SANDBOX (Top Right) */}
      <div
        className="absolute top-28 sm:top-32 -right-2 sm:right-6 z-30 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${cardsX * 0.8}px, ${-cardsY * 0.5}px, 60px)`
        }}
      >
        <div className="glass-card rounded-2xl p-4 sm:p-5 w-44 sm:w-52 shadow-lg border border-white/80 animate-float-reverse">
          <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            SANDBOX
          </div>
          <div className="mt-1.5 text-xs text-gray-700 leading-snug">
            Isolated. Secure. <br />
            <span className="font-semibold text-[#101114]">Reproducible.</span>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5">
            <span className="text-[11px] font-mono font-medium text-gray-500">Docker gVisor</span>
            {/* Docker Icon SVG */}
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.186.185.186m0 2.714h2.118a.186.186 0 00.186-.185V6.289a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.954 0h2.119a.186.186 0 00.186-.185V6.289a.186.186 0 00-.186-.185H8.075a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m0 2.716h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186H8.075a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954 0h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186H5.12a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954 0h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186H2.167a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185M23.6 11.3c-.35-.24-.96-.33-1.63-.26-.14-.73-.55-1.42-1.22-1.92l-.5-.35-.38.48c-.5.62-.78 1.4-.82 2.21-.4.08-.8.2-1.21.35l-.23.08v-2.8H.24v6.8c.03.65.21 1.28.53 1.85C2.18 20.3 5.86 21 11.5 21c6.43 0 10.74-.95 12.1-3.21.13-.23.23-.48.29-.74.32-.97.16-2.03-.49-2.75" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 7. FLOATING GLASS CARD: MULTI-DIMENSIONAL SCORING (Bottom Right) */}
      <div
        className="absolute bottom-4 sm:bottom-8 right-2 sm:right-6 z-30 transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${cardsX * 0.9}px, ${cardsY * 0.8}px, 80px)`
        }}
      >
        <div className="glass-card rounded-2xl p-4 sm:p-5 w-60 sm:w-72 shadow-xl border border-white/85">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            <span>MULTI-DIMENSIONAL SCORING</span>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            {/* Functional Accuracy */}
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Functional Accuracy</span>
                <span className="font-mono font-bold text-[#101114]">35%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full w-[88%]" />
              </div>
            </div>

            {/* Code Quality */}
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Code Quality</span>
                <span className="font-mono font-bold text-[#101114]">20%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full w-[78%]" />
              </div>
            </div>

            {/* Production Realism */}
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Production Realism</span>
                <span className="font-mono font-bold text-[#101114]">15%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full w-[72%]" />
              </div>
            </div>

            {/* Security */}
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Security</span>
                <span className="font-mono font-bold text-[#101114]">15%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[94%]" />
              </div>
            </div>

            {/* Cost & Latency */}
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Cost &amp; Latency</span>
                <span className="font-mono font-bold text-[#101114]">15%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full w-[82%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
