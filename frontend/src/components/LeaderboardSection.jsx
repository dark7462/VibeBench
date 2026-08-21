import React, { useState, useEffect } from 'react'
import { Trophy, Search, Filter, ArrowUpRight, CheckCircle, Zap, Shield, Cpu, RefreshCw, BarChart2 } from 'lucide-react'
import { api, DEFAULT_LEADERBOARD } from '../lib/api'

export default function LeaderboardSection({ onOpenBenchmark, onOpenCompare }) {
  const [leaderboard, setLeaderboard] = useState(DEFAULT_LEADERBOARD)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('ALL') // 'ALL' | 'Proprietary' | 'Open Source'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      const data = await api.getLeaderboard()
      setLeaderboard(data)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  const filteredData = leaderboard.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.provider.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'ALL' || item.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  return (
    <section id="leaderboard" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/8 shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-wider text-[#101114] uppercase">
              Global AI Coding Index
            </span>
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#101114] tracking-tight">
            See which models <br className="hidden sm:inline" />
            actually ship.
          </h2>

          <p className="text-base text-[#5F6470] max-w-xl">
            Live rankings powered by thousands of deterministic sandbox runs across real repositories.
          </p>
        </div>

        {/* Top actions: Compare & Run Benchmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenCompare && onOpenCompare(leaderboard.slice(0, 3))}
            className="px-4 py-2.5 glass-card glass-card-hover rounded-xl text-xs font-semibold text-[#101114] flex items-center gap-2 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-violet-600" />
            <span>Compare Models</span>
          </button>
          <button
            onClick={onOpenBenchmark}
            className="px-5 py-2.5 bg-[#101114] hover:bg-[#23262E] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Run Benchmark ↗</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search model or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/70 rounded-xl text-xs text-[#101114] placeholder-gray-400 border border-black/5 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Proprietary', 'Open Source'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-[#101114] text-white shadow-xs'
                  : 'text-[#5F6470] hover:bg-black/5'
              }`}
            >
              {filter === 'ALL' ? 'All Models' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-white/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/8 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-black/[0.02]">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Model</th>
                <th className="py-4 px-6 text-center">Score</th>
                <th className="py-4 px-6 text-center">Accuracy</th>
                <th className="py-4 px-6 text-center">Latency</th>
                <th className="py-4 px-6 text-center">Cost / 1K LOC</th>
                <th className="py-4 px-6 text-center">Self-Healing</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs font-medium text-[#101114]">
              {filteredData.map((row, idx) => {
                const isTop1 = row.rank === '01'
                const isTop2 = row.rank === '02'
                const isTop3 = row.rank === '03'

                return (
                  <tr
                    key={row.name}
                    className={`hover:bg-black/[0.025] transition-colors ${
                      isTop1 ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                            isTop1
                              ? 'bg-amber-100 text-amber-800'
                              : isTop2
                              ? 'bg-slate-200 text-slate-800'
                              : isTop3
                              ? 'bg-amber-700/10 text-amber-900'
                              : 'bg-black/5 text-gray-500'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </div>
                    </td>

                    {/* Model Name & Provider */}
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-display font-bold text-sm text-[#101114] flex items-center gap-1.5">
                          <span>{row.name}</span>
                          {isTop1 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{row.provider}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-black/5 text-[10px]">
                            {row.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vibe Score */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-extrabold text-sm text-violet-600">
                          {row.score}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                          {row.change}
                        </span>
                      </div>
                    </td>

                    {/* Accuracy */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono font-semibold text-gray-800">
                        {row.accuracy}%
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-gray-600">
                        {row.latency}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-gray-600">
                        {row.cost}
                      </span>
                    </td>

                    {/* Self Healing Success */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-violet-700 font-semibold">
                        {row.selfHealing}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={onOpenBenchmark}
                        className="px-3 py-1.5 rounded-lg bg-black/5 hover:bg-[#101114] hover:text-white text-[#101114] text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Benchmark</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
