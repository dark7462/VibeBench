// VibeBench API Client for FastAPI Backend (SQLite & Zero-Config Local & Cloud Deploys)

const API_BASE = import.meta.env.VITE_API_BASE || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : ''
);

export const DEFAULT_LEADERBOARD = [
  {
    rank: '01',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'openai',
    score: 92.46,
    accuracy: 96.2,
    latency: '12.4s',
    cost: '$0.014',
    selfHealing: '88.4%',
    security: '99.1%',
    type: 'Proprietary',
    language: 'Polyglot',
    change: '+1.2'
  },
  {
    rank: '02',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'anthropic',
    score: 89.31,
    accuracy: 94.1,
    latency: '14.1s',
    cost: '$0.018',
    selfHealing: '85.7%',
    security: '98.8%',
    type: 'Proprietary',
    language: 'Polyglot',
    change: '+0.8'
  },
  {
    rank: '03',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    badge: 'google',
    score: 86.72,
    accuracy: 91.5,
    latency: '11.8s',
    cost: '$0.009',
    selfHealing: '81.2%',
    security: '97.5%',
    type: 'Proprietary',
    language: 'Polyglot',
    change: '+2.1'
  },
  {
    rank: '04',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'deepseek',
    score: 84.15,
    accuracy: 89.4,
    latency: '16.2s',
    cost: '$0.003',
    selfHealing: '79.0%',
    security: '96.2%',
    type: 'Open Source',
    language: 'Polyglot',
    change: '+3.4'
  }
];

export const DEFAULT_STATS = {
  totalRuns: 1248,
  codingProblems: 328,
  modelsEvaluated: 87,
  sandboxIsolation: '100%',
  topModel: 'GPT-4o',
  avgLatencyMs: 13420,
  totalCostUsd: 184.62
};

export const MOCK_SCENARIOS = [
  {
    id: 'payment-idempotency',
    title: 'Payment Gateway Distributed Lock & Idempotency',
    language: 'TypeScript / Node.js',
    difficulty: 'Hard',
    prompt: 'Implement a distributed lock-protected Stripe webhook handler with exponential backoff and Redis deduplication token.',
    initialTests: { total: 84, passed: 76, failed: 8 },
    failedReason: 'Race condition detected on concurrent replay requests: duplicate charge was not rejected in < 5ms.',
    patchApplied: 'Added atomic Redis SETNX with lease expiration and mutex token validation in webhook ingest layer.',
    finalTests: { total: 84, passed: 84, failed: 0 }
  },
  {
    id: 'rate-limiter',
    title: 'Sliding Window Token Bucket Rate Limiter',
    language: 'Go / Python',
    difficulty: 'Medium',
    prompt: 'Create an in-memory & Redis sliding-window log rate limiter with microsecond timestamp granularity and burst tolerance.',
    initialTests: { total: 60, passed: 54, failed: 6 },
    failedReason: 'Timestamp precision overflow caused bucket leak under 10,000 req/sec burst.',
    patchApplied: 'Migrated to Lua atomic script execution inside Redis with monotonic nanosecond clock.',
    finalTests: { total: 60, passed: 60, failed: 0 }
  },
  {
    id: 'auth-jwt',
    title: 'OAuth2 PKCE & JWT Rotation Engine',
    language: 'Python / FastAPI',
    difficulty: 'Hard',
    prompt: 'Build asymmetric RS256 token verification with JWKS caching, clock skew leeway, and revoking stale refresh tokens.',
    initialTests: { total: 72, passed: 68, failed: 4 },
    failedReason: 'Alg=none vulnerability bypassed signature check in spoofed header test.',
    patchApplied: 'Enforced explicit algorithm whitelist ["RS256"] and strict key-id (kid) thumbprint match.',
    finalTests: { total: 72, passed: 72, failed: 0 }
  }
];

export const api = {
  getApiBase() {
    return API_BASE;
  },

  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/healthcheck`);
      if (res.ok) return await res.json();
    } catch {}
    return { status: 'unknown', app: 'VibeBench API' };
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/stats`);
      if (res.ok) {
        const data = await res.json();
        return { ...DEFAULT_STATS, ...data };
      }
    } catch {}
    return DEFAULT_STATS;
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {}
    return DEFAULT_LEADERBOARD;
  },

  async getJob(jobId) {
    const token = localStorage.getItem('vibebench_token');
    try {
      const res = await fetch(`${API_BASE}/api/v1/job/${jobId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async getRuns(modelName = '') {
    const token = localStorage.getItem('vibebench_token');
    const url = modelName ? `${API_BASE}/api/v1/model?name=${encodeURIComponent(modelName)}` : `${API_BASE}/api/v1/model`;
    try {
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async triggerBenchmark(payload) {
    const token = localStorage.getItem('vibebench_token');
    try {
      const res = await fetch(`${API_BASE}/api/v1/model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API call failed, returning simulated job response', err);
    }
    // Return simulated job for interactive preview
    return {
      job_id: 'job_' + Math.random().toString(36).substring(2, 9),
      jobId: 'job_' + Math.random().toString(36).substring(2, 9),
      modelName: payload.modelName || 'GPT-4o',
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
      message: 'Benchmark job scheduled in Docker sandbox pool'
    };
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return await res.json();
  },

  async register(name, email, password, profession) {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, profession })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  },

  // Fetches free models from opencode CLI + API provider list
  // Called by BenchmarkModal to power the model picker UI
  async getModels() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/models`);
      if (res.ok) return await res.json();
    } catch {}
    // Fallback if backend is unreachable
    return { free_models: [], api_providers: [] };
  }
};
