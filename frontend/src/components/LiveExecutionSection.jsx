import React, { useState, useEffect, useRef } from 'react'
import { Play, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Shield, Cpu, Terminal, Sparkles, Layers, FileCode, Check } from 'lucide-react'
import { MOCK_SCENARIOS } from '../lib/api'

export default function LiveExecutionSection() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState('GPT-4o')
  const [activeTab, setActiveTab] = useState('terminal') // 'terminal' | 'diff' | 'telemetry'
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState([])
  const [completed, setCompleted] = useState(false)

  const scenario = MOCK_SCENARIOS[selectedScenarioIndex]

  const executionSteps = [
    { text: `[00:00.04] > Booting isolated sandbox container (ubuntu:22.04 / gVisor)`, type: 'info' },
    { text: `[00:00.18] > Initializing security bounds: Memory Limit=512MB, CPU Quota=2.0, Net=Disabled`, type: 'info' },
    { text: `[00:00.32] > Injecting model generated code for: ${scenario.title}`, type: 'info' },
    { text: `[00:00.45] > Running test harness against ${scenario.initialTests.total} test cases...`, type: 'info' },
    { text: `[00:01.12] ⚠️ Test Suite Incomplete: ${scenario.initialTests.passed} Passed | ${scenario.initialTests.failed} Failed`, type: 'warning' },
    { text: `[00:01.15] 💥 Failure Reason: ${scenario.failedReason}`, type: 'error' },
    { text: `[00:01.30] 🔄 [SELF-HEALING LOOP] Attempt 1/5 triggered...`, type: 'healing' },
    { text: `[00:01.85] > Feeding error stack trace & AST diff into healing agent...`, type: 'healing' },
    { text: `[00:02.40] ✓ Code Patch Applied: ${scenario.patchApplied}`, type: 'success' },
    { text: `[00:02.75] > Re-executing test harness inside sandbox...`, type: 'info' },
    { text: `[00:03.10] ✅ Test Execution Succeeded: ${scenario.finalTests.passed} / ${scenario.finalTests.total} Passed (100.0%)`, type: 'success' },
    { text: `[00:03.20] 🎯 Overall Benchmark Score: 94.8 / 100 | Latency: 3.2s | Memory Peak: 142MB`, type: 'success' }
  ]

  const runSimulation = () => {
    setIsRunning(true)
    setLogs([])
    setCurrentStep(0)
    setCompleted(false)

    let step = 0
    const interval = setInterval(() => {
      if (step < executionSteps.length) {
        const item = executionSteps[step]
        if (item) {
          setLogs((prev) => [...prev, item])
          setCurrentStep(step)
        }
        step++
      } else {
        clearInterval(interval)
        setIsRunning(false)
        setCompleted(true)
      }
    }, 380)
  }

  useEffect(() => {
    runSimulation()
  }, [selectedScenarioIndex, selectedModel])

  return (
    <section id="live-execution" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/8 shadow-xs">
          <Terminal className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
            Live Sandbox Execution Engine
          </span>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#101114] tracking-tight">
          Don't trust the output. <br />
          <span className="text-gradient-vibrant">Run it.</span>
        </h2>

        <p className="text-base sm:text-lg text-[#5F6470] font-normal leading-relaxed">
          Every model gets a real environment. Every line gets tested. <br className="hidden sm:inline" />
          Every failure gets another chance.
        </p>
      </div>

      {/* Interactive Terminal Card */}
      <div className="glass-dark rounded-3xl p-4 sm:p-7 shadow-2xl border border-white/15 max-w-5xl mx-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          {/* Scenario Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {MOCK_SCENARIOS.map((sc, index) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioIndex(index)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedScenarioIndex === index
                    ? 'bg-white/20 text-white border border-white/30 shadow-xs'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {sc.title.split(' ')[0]} {sc.title.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Model Selector & Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-gray-300">
              <span className="text-gray-500">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="GPT-4o" className="bg-[#101114]">GPT-4o</option>
                <option value="Claude 3.5 Sonnet" className="bg-[#101114]">Claude 3.5 Sonnet</option>
                <option value="Gemini 1.5 Pro" className="bg-[#101114]">Gemini 1.5 Pro</option>
                <option value="DeepSeek V3" className="bg-[#101114]">DeepSeek V3</option>
              </select>
            </div>

            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Rerun Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subheader: Active Prompt & View Switcher */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/10">
          <div className="text-gray-300 font-mono flex items-center gap-2">
            <span className="text-violet-400 font-bold">TASK:</span>
            <span className="text-gray-400">{scenario.prompt}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'terminal' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Live Terminal
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'diff' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Self-Healing Diff
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'telemetry' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sandbox Telemetry
            </button>
          </div>
        </div>

        {/* Tab 1: Terminal Console */}
        {activeTab === 'terminal' && (
          <div className="py-5 font-mono text-[12.5px] leading-relaxed min-h-[320px] max-h-[380px] overflow-y-auto space-y-1.5">
            {logs.filter(Boolean).map((log, i) => {
              if (!log || !log.text) return null
              let color = 'text-gray-300'
              if (log.type === 'error') color = 'text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-800/40'
              if (log.type === 'warning') color = 'text-amber-300'
              if (log.type === 'healing') color = 'text-violet-300 font-semibold'
              if (log.type === 'success') color = 'text-emerald-400 font-semibold'
              return (
                <div key={i} className={`${color} animate-in fade-in slide-in-from-left-1 duration-150`}>
                  {log.text}
                </div>
              )
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-violet-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                <span className="text-xs">Docker sandbox container active...</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Code Diff View */}
        {activeTab === 'diff' && (
          <div className="py-4 font-mono text-xs min-h-[320px] max-h-[380px] overflow-y-auto bg-black/40 rounded-2xl p-4 border border-white/5 space-y-1">
            <div className="text-gray-400 pb-2 mb-2 border-b border-white/10 font-sans font-semibold">
              Self-Healing Automated Patch (Attempt 1/5)
            </div>
            <div className="text-gray-500">// --- original_solution.ts</div>
            <div className="text-gray-500">// +++ healed_solution.ts</div>
            <div className="text-red-400 bg-red-950/40 px-2 py-1 rounded">
              - async function handleWebhook(req) &#123; <br />
              - &nbsp;&nbsp;await db.charges.insert(req.body); <br />
              - &#125;
            </div>
            <div className="text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded mt-2">
              + async function handleWebhook(req) &#123; <br />
              + &nbsp;&nbsp;const lockAcquired = await redis.set(`lock:$&#123;req.body.id&#125;`, "locked", "NX", "EX", 10); <br />
              + &nbsp;&nbsp;if (!lockAcquired) return &#123; status: 409, message: "Duplicate charge replay rejected" &#125;; <br />
              + &nbsp;&nbsp;await db.charges.insert(req.body); <br />
              + &#125;
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="py-6 min-h-[320px] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs font-semibold mb-1">CPU UTILIZATION</div>
              <div className="text-2xl font-bold font-mono text-white">18.4%</div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                <div className="bg-violet-500 h-full rounded-full w-[18%]" />
              </div>
              <div className="text-[11px] text-gray-500 mt-2">gVisor runtime sandbox</div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs font-semibold mb-1">MEMORY PEAK</div>
              <div className="text-2xl font-bold font-mono text-white">142 MB</div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-full rounded-full w-[28%]" />
              </div>
              <div className="text-[11px] text-gray-500 mt-2">Hard limit: 512 MB</div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs font-semibold mb-1">NETWORK ISOLATION</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">100% EGRESS BLOCKED</div>
              <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
              </div>
              <div className="text-[11px] text-gray-500 mt-2">Zero credential exfiltration</div>
            </div>
          </div>
        )}

        {/* Bottom Status Ribbon */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sandbox State: Active</span>
            </span>
            <span>Runtime: Node 20.x + Ubuntu 22.04</span>
          </div>

          <div className="text-gray-500 font-mono">
            VibeBench Engine v2.4.0 • Redis Distributed Queue
          </div>
        </div>
      </div>
    </section>
  )
}
