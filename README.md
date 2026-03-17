# OpenTax

**Free, open-source Income Tax Return (ITR) filing for India.**

OpenTax is a single-page web application that lets you fill out your ITR-1 form entirely in the browser — no login, no API calls during editing, no tracking. When you're done, one click submits the complete filing.

## Features

- **No login required** — start filling immediately
- **Single page** — all sections (Personal Details, Income, Deductions, Tax Paid) on one page with tab navigation
- **Offline-first** — data stays in your browser until you submit
- **Open source** — MIT licensed, full transparency

## Project Structure

```
OpenTax/
├── web/     # Next.js frontend (React 19, TypeScript, Tailwind CSS 4)
├── api/     # Backend API (planned)
├── docs/    # Implementation plans
└── README.md
```

## Getting Started

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000`

## Documentation

See [docs/](docs/) for detailed implementation plans:
- [00 — Execution Checklist](docs/00-EXECUTION-CHECKLIST.md)
- [01 — Project Overview](docs/01-PROJECT-OVERVIEW.md)
- [02 — Phase 1: Scaffold](docs/02-PHASE-1-SCAFFOLD.md)
- [03 — Phase 2: Models](docs/03-PHASE-2-MODELS.md)
- [04 — Phase 3: Context](docs/04-PHASE-3-CONTEXT.md)
- [05 — Phase 4: UI Components](docs/05-PHASE-4-UI-COMPONENTS.md)
- [06 — Phase 5: Tab Components](docs/06-PHASE-5-TAB-COMPONENTS.md)
- [07 — Phase 6: Single Page](docs/07-PHASE-6-SINGLE-PAGE.md)
- [08 — Phase 7: Submit](docs/08-PHASE-7-SUBMIT.md)

## Tech Stack

- Next.js 16 (App Router, static export)
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Lucide React + Heroicons

## License

MIT
