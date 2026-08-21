import React, { useState, useEffect } from 'react'

export default function LoadingScreen({ onFinished }) {
  const [progress, setProgress] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [fading, setFading] = useState(false)

  const stages = [
    'Initializing environment',
    'Loading evaluator',
    'Connecting benchmark engine',
    'Preparing sandbox',
    'Ready'
  ]

  useEffect(() => {
    const stepDuration = 220
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 20
        if (next >= 100) {
          clearInterval(interval)
          setStageIndex(4)
          setTimeout(() => {
            setFading(true)
            setTimeout(() => {
              onFinished()
            }, 400)
          }, 300)
          return 100
        }
        setStageIndex(Math.min(stages.length - 1, Math.floor(next / 20)))
        return next
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [onFinished, stages.length])

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col items-center justify-center transition-all duration-400 ${
        fading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="text-center space-y-6 max-w-sm px-6">
        {/* Minimal VibeBench Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#101114] flex items-center justify-center shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L12 20L20 4" stroke="url(#loading-grad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="loading-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF6B4A" />
                  <stop offset="0.5" stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-display font-extrabold text-2xl text-[#101114] tracking-tight">
            VibeBench
          </span>
        </div>

        {/* Status text */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] font-bold tracking-widest text-gray-400 uppercase">
            INITIALIZING BENCHMARK ENGINE
          </div>
          <div className="text-xs text-gray-600 font-medium h-4">
            {stages[stageIndex]}
          </div>
        </div>

        {/* Thin progress indicator */}
        <div className="w-48 mx-auto bg-gray-200/80 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#FF6B4A] via-[#8B5CF6] to-[#3B82F6] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
