# 🎨 VibeBench — Frontend

Glassmorphic, dark-mode React SPA for the VibeBench AI Coding Benchmark Platform. Built with React 19, Vite 8, TailwindCSS 4, Framer Motion, and Three.js.

---

## 🗂️ Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Marketing homepage (all sections)
│   │   ├── Login.jsx            # Auth page (email/pass + Google OAuth)
│   │   └── Dashboard.jsx        # Authenticated benchmark dashboard
│   ├── components/
│   │   ├── Navbar.jsx           # Sticky glassmorphic header with auth state
│   │   ├── Hero.jsx             # Hero section with 3D scene + CTA
│   │   ├── HeroScene.jsx        # Three.js particle/geometry 3D background
│   │   ├── InteractiveBackground.jsx  # Mouse-reactive particle canvas
│   │   ├── LoadingScreen.jsx    # First-visit loading animation (sessionStorage gated)
│   │   ├── BenchmarkModal.jsx   # Main benchmark submission modal (Free + API tabs)
│   │   ├── CompareModal.jsx     # Side-by-side model comparison view
│   │   ├── DocsModal.jsx        # In-app API documentation drawer
│   │   ├── LiveExecutionSection.jsx   # Landing — animated code execution demo
│   │   ├── HowItWorksSection.jsx      # Landing — 4-step process breakdown
│   │   ├── SelfHealingSection.jsx     # Landing — self-healing loop visualization
│   │   ├── EvaluationSection.jsx      # Landing — scoring metrics explainer
│   │   ├── LeaderboardSection.jsx     # Landing — top-10 leaderboard preview
│   │   ├── FeatureSection.jsx         # Landing — feature grid cards
│   │   ├── CTASection.jsx             # Landing — call to action
│   │   └── Footer.jsx                 # Footer with tech stack + links
│   ├── lib/
│   │   └── api.js               # Typed API client with VITE_API_BASE support
│   ├── App.jsx                  # React Router setup + PrivateRoute guards
│   ├── main.jsx                 # App entry point (StrictMode)
│   └── index.css                # Global styles + TailwindCSS + custom utilities
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## ⚡ Key Features

### BenchmarkModal — Two-Tab Submission
- **Free Models tab**: Calls `GET /api/v1/models` to dynamically load models available via `opencode` CLI with no API key needed. List updates live from the server.
- **API Key tab**: User picks a provider (OpenAI, Anthropic, Google, Groq, etc.), enters their API key, picks a model — submission is gated by authentication.
- **Live Terminal**: SSE `EventSource` stream connected to `/api/v1/job/{id}/stream` shows Docker stdout in real time, ANSI-free.

### Dashboard — Benchmark History
- Lists all past benchmark jobs for the logged-in user
- Manual refresh button (no polling — avoids unnecessary API calls)
- Click any job to open the terminal and see full logs + scores

### Routing & Auth
```
/           → LandingPage     (public)
/login      → Login           (public, redirects if logged in)
/dashboard  → Dashboard       (JWT-gated via PrivateRoute)
*           → redirect to /
```

JWT token stored in `localStorage`. All authenticated requests include `Authorization: Bearer <token>` header automatically via `api.js`.

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- Backend running on port 8000

### Install & Run
```bash
cd frontend
npm install

# Point to your backend
echo "VITE_API_BASE=http://localhost:8000" > .env.local

npm run dev
```

Open http://localhost:5173

### Other Commands
```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

---

## 🌐 Vercel Deployment

1. Push to GitHub (auto-detected as Vite project)
2. In Vercel project settings → **Environment Variables**:
   ```
   VITE_API_BASE = http://YOUR_EC2_IP:8000
   ```
3. Redeploy → done

Vercel auto-deploys on every push to `main`.

---

## 🎨 Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAFAFA` | Page base |
| Text Primary | `#101114` | Headings, body |
| Text Secondary | `#5F6470` | Labels, nav |
| Coral | `#FF6B4A` | Primary accent, gradient start |
| Violet | `#8B5CF6` | Gradient mid, highlights |
| Blue | `#3B82F6` | Gradient end, links |

### Typography
- Display: `Outfit` (headings)
- Body: `Inter` (paragraphs, UI)
- Code: `JetBrains Mono` (terminal, code blocks)

### Key CSS Patterns
```css
/* Glassmorphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
}
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19 | UI framework |
| `react-dom` | 19 | DOM renderer |
| `react-router-dom` | 7 | Client-side routing (Link, useNavigate) |
| `framer-motion` | 13 | Animation library |
| `three` | 0.185 | 3D hero scene |
| `lucide-react` | 1.17 | Icon set |
| `canvas-confetti` | 1.9 | Celebration animation on job complete |
| `tailwindcss` | 4 | Utility CSS |
| `vite` | 8 | Build tool + dev server |

---

## 🐛 Known Bugs Fixed

| Bug | Fix |
|-----|-----|
| White page on tab switch | `sessionStorage` gate on LoadingScreen + `<Link>` instead of `<a href>` |
| Constant API polling on dashboard | Removed polling, added manual refresh button + SSE only during active jobs |
| ANSI codes in terminal | Stripped server-side before storing in DB — clean text served to all clients |
| Models not loading | `/api/v1/models` now calls `opencode models` CLI live, parses output dynamically |
