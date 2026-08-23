import React, { useState, useEffect } from 'react'
import LoadingScreen from '../components/LoadingScreen'
import InteractiveBackground from '../components/InteractiveBackground'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import LiveExecutionSection from '../components/LiveExecutionSection'
import HowItWorksSection from '../components/HowItWorksSection'
import SelfHealingSection from '../components/SelfHealingSection'
import EvaluationSection from '../components/EvaluationSection'
import LeaderboardSection from '../components/LeaderboardSection'
import FeatureSection from '../components/FeatureSection'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'
import BenchmarkModal from '../components/BenchmarkModal'
import CompareModal from '../components/CompareModal'
import DocsModal from '../components/DocsModal'

export default function LandingPage() {
  // Only show the loading screen on the very first visit in this browser session.
  // sessionStorage persists across tab switches but clears when the tab is closed.
  // This prevents the white-flash loading replay every time the user navigates back.
  const [isLoading, setIsLoading] = useState(
    () => !sessionStorage.getItem('vb_loaded')
  )
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [compareModels, setCompareModels] = useState([])
  const [docsModalOpen, setDocsModalOpen] = useState(false)

  const handleOpenBenchmark = () => {
    setBenchmarkModalOpen(true)
  }

  const handleOpenCompare = (models) => {
    setCompareModels(models || [])
    setCompareModalOpen(true)
  }

  const handleOpenDocs = () => {
    setDocsModalOpen(true)
  }

  const handleNavigateSection = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#101114] font-sans selection:bg-[#101114] selection:text-white">
      {/* 1. Initial Minimal Loading Sequence — only shown once per browser session */}
      {isLoading && (
        <LoadingScreen
          onFinished={() => {
            sessionStorage.setItem('vb_loaded', '1') // mark as shown
            setIsLoading(false)
          }}
        />
      )}

      {/* 2. Interactive Antigravity Particle Background */}
      <InteractiveBackground />

      {/* 3. Sleek Glass Header / Navbar */}
      <Navbar
        onOpenBenchmark={handleOpenBenchmark}
        onOpenDocs={handleOpenDocs}
        onNavigateSection={handleNavigateSection}
      />

      {/* 4. Main Content Sections */}
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero
          onOpenBenchmark={handleOpenBenchmark}
          onNavigateSection={handleNavigateSection}
        />

        {/* Live Execution Sandbox Section */}
        <LiveExecutionSection />

        {/* How VibeBench Works Section */}
        <HowItWorksSection />

        {/* 5-Step Self-Healing Loop Visualization */}
        <SelfHealingSection />

        {/* Multi-Dimensional Scoring Evaluation Section */}
        <EvaluationSection />

        {/* Real-Time Leaderboard Section */}
        <LeaderboardSection
          onOpenBenchmark={handleOpenBenchmark}
          onOpenCompare={handleOpenCompare}
        />

        {/* Infrastructure Feature Grid */}
        <FeatureSection />

        {/* Final CTA Section */}
        <CTASection
          onOpenBenchmark={handleOpenBenchmark}
          onOpenDocs={handleOpenDocs}
        />
      </main>

      {/* 5. Minimal Swiss Footer */}
      <Footer
        onOpenBenchmark={handleOpenBenchmark}
        onOpenDocs={handleOpenDocs}
        onNavigateSection={handleNavigateSection}
      />

      {/* 6. Interactive Modals */}
      <BenchmarkModal
        isOpen={benchmarkModalOpen}
        onClose={() => setBenchmarkModalOpen(false)}
      />

      <CompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        models={compareModels}
      />

      <DocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  )
}
