<div align="center">

<img src="public/logo.svg" alt="CreatorOS logo" width="140" height="140" />

# CreatorOS

**AI-powered social media management & content intelligence platform**

Plan, create, schedule, and publish content across TikTok, Instagram, YouTube, and Facebook — with unified analytics and an AI content assistant, all in one workspace.

<br/>

![React](https://img.shields.io/badge/React-19-149ECA)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![Express](https://img.shields.io/badge/Express-4-000000)
![Vite](https://img.shields.io/badge/Vite-6-646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18)

</div>

---

## Overview

Content creators juggle a separate app for every platform — each with its own editor, analytics dashboard, scheduler, and publishing flow. Uploads are repeated, scheduling is fragmented, analytics can't be compared side by side, and content ideas live far away from the performance data that should inform them.

**CreatorOS** centralises the whole workflow into a single dashboard: connect your accounts once, view unified analytics, manage a central content library, generate AI-assisted ideas/hooks/scripts/shot lists, discover trends, schedule to a shared calendar, and publish to multiple platforms.

The initial system is designed around the workflow of **Lean Muzveba**, a student and technology content creator.

## Features

- 🔗 **Connect multiple social accounts** — TikTok, Instagram, YouTube, and Facebook via OAuth (no passwords stored).
- 📊 **Unified analytics dashboard** — views, reach, followers, and engagement aggregated across every connected platform.
- 📈 **Cross-platform comparison** — performance by platform and by content category, side by side.
- 🗂️ **Central content library** — one home for ideas, drafts, scheduled, and published posts, with search and filters.
- 🏷️ **Content pillars** — categorise content against defined brand pillars.
- 🤖 **AI content assistant** — generate ideas, visual hooks, written hooks, voiceover scripts, recommended shots, and editing suggestions (Google Gemini, with a curated offline fallback).
- 🔥 **Trend explorer** — discover relevant trends, filter by platform and category, with adaptation guidance.
- 🗓️ **Content calendar** — month and week views with timezone-aware scheduling.
- 🚀 **Multi-platform publishing** — prepare one piece of content and publish to the supported platforms where permitted.
- 🔄 **Idea → publication tracking** — follow content through its full lifecycle.

### Content pillars

The AI assistant is tuned to five content pillars:

`Tech Education` · `Breaking Into Tech` · `Free Tech Resources` · `Student & Academic Life` · `Microsoft Journey`

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts, lucide-react |
| Backend | Node.js + Express 4 (run directly via Node's TypeScript type-stripping) |
| AI | Google Gemini (`@google/genai`) |
| Testing | Vitest |
| Persistence | In-memory store with JSON file persistence (`creator_storage.json`) |

## Getting started

**Prerequisites:** Node.js 22+ (the backend runs `.ts` directly via Node's type-stripping).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (see below)
cp .env.example .env.local

# 3. Start the backend API (http://localhost:3000)
npm run dev

# 4. In a second terminal, start the Vite frontend dev server
npx vite
```

### Environment variables

All keys are optional — features degrade gracefully when a key is absent (the AI assistant falls back to curated content, and unconfigured platforms show a setup guide instead of launching OAuth).

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for the AI assistant |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok OAuth |
| `META_APP_ID` / `META_APP_SECRET` | Instagram & Facebook (Meta) OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | YouTube (Google) OAuth |
| `APP_URL` | Public base URL used to build OAuth redirect URIs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Express backend (`node server.ts`) on port 3000 |
| `npm run build` | Build the production frontend bundle with Vite |
| `npm start` | Start the backend (serves the built `dist/` in production) |
| `npm run lint` | Type-check the frontend (`tsc --noEmit`) |
| `npm test` | Run the Vitest unit-test suite |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

```
creator-os/
├── index.html               # Vite entry (favicon, fonts, theme)
├── server.ts                # Express app entry: middleware, mounts routers, static/SPA
├── server/                  # Backend modules
│   ├── logger.ts            # Server logging surface
│   ├── store.ts             # Seed data + in-memory store + JSON persistence
│   ├── metrics.ts           # Metric parse/format helpers
│   └── routes/              # Feature routers (posts, accounts, auth*, trends, analytics, ai, legal)
├── src/                     # Frontend
│   ├── App.tsx              # App shell + view routing
│   ├── context/AppContext.tsx   # Global state store
│   ├── components/          # UI components (Header, modals, accounts/*)
│   ├── views/               # Dashboard, Content Library, AI, Analytics, Trends, Calendar
│   └── utils/               # logger, metricUtils, calendarUtils, videoUtils
└── docs/                    # Requirements, feasibility, and use-case analysis
```

## API

The backend exposes a JSON API under `/api` plus OAuth callbacks and legal pages.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List posts (filter by `status`, `category`, `platform`) |
| `POST` | `/api/posts` | Create a post |
| `PUT` | `/api/posts/:id` | Update a post |
| `DELETE` | `/api/posts/:id` | Delete a post |
| `GET` | `/api/accounts` | List connected accounts |
| `POST` | `/api/accounts/sync` · `/reset` · `/:id/toggle` | Sync / reset / toggle accounts |
| `PUT` | `/api/accounts/:id` | Update an account's handle & metrics |
| `GET` | `/api/auth/{tiktok,instagram,facebook,youtube}/url` | Build an OAuth authorization URL |
| `GET` | `/api/auth/{…}/callback` | OAuth callback handlers |
| `GET` | `/api/trends` | Trends feed (filter by `platform`) |
| `GET` | `/api/analytics` | Aggregated analytics (filter by `range`) |
| `POST` | `/api/ai/generate` | Generate ideas / hooks / scripts / shot lists |
| `GET` | `/privacy` · `/terms` | Legal pages for platform app review |

## Constraints & notes

- **Official APIs only.** The system stores authorised accounts and retrieves permitted information through each platform's official API — it never scrapes or stores social-media passwords.
- **OAuth-based auth.** Authorisation uses OAuth; tokens are held server-side, not user passwords.
- **Platform capabilities vary.** Not every metric, trend source, or publishing behaviour is available on every platform. Some publishing capabilities require platform app review before public publishing is permitted, and "one upload" may still require platform-specific metadata.
- **Rate limits.** Third-party API requests may be subject to rate limits.

---

<div align="center">
<sub>Built for creators who'd rather make content than manage five dashboards.</sub>
</div>
