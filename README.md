<p align="center">
  <img src="web/public/ITAI-logo.png" alt="OpenTax" height="72" />
</p>

<h1 align="center">OpenTax</h1>

<p align="center">
  <a href="https://indiatax.ai"><strong>Powered by IndiaTax.AI</strong></a>
</p>

<br/>

OpenTax is a free, open-source Income Tax Return (ITR) filing application for India. It provides a single-page browser interface for completing ITR filings, backed by a FastAPI service that performs tax calculations, ITR construction, and validation.

## Project Structure

```
OpenTax/
├── web/          Next.js 16 frontend — React 19, TypeScript 5.9, Tailwind CSS 4
├── api/          FastAPI backend — tax calculation, ITR building, validation
└── README.md
```

## Features

- No authentication required
- Single-page layout with tab navigation (Personal Details, Income, Deductions, Tax Paid, Summary)
- Automatic tax computation under both Old and New regimes
- ITR JSON construction with validation error reporting
- Static export — the frontend can be served directly from the FastAPI process in production
- Apache 2.0 licensed

---

## Frontend — web/

### Prerequisites

- Node.js 24.12.0 or later
- npm 10 or later

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

The frontend expects the API at `http://localhost:8000` by default. This is configured in `web/.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Build

```bash
npm run build
```

Produces a static export in `web/out/`. In production deployments, this directory is copied to `api/frontend/` and served by the FastAPI process.

### Lint

```bash
npm run lint
```

### Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start Next.js development server with Turbopack |
| build | `npm run build` | Produce static export to `out/` |
| start | `npm start` | Start Next.js production server |
| lint | `npm run lint` | Run ESLint |

---

## Backend — api/

See [api/README.md](api/README.md) for full API setup and endpoint documentation.

---

## Running Both Services Together

### One-command launch (Windows)

Run the included PowerShell script from the repository root to start both servers and open the browser automatically:

```powershell
.\start.ps1
```

This opens two terminal windows (API + frontend) and launches `http://localhost:3000` in Chrome once the servers are ready.

### Manual start

Open two terminal sessions from the repository root.

**Terminal 1 — API:**
```bash
cd api
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd web
npm run dev
```

Access the application at `http://localhost:3000`.

---

## Getting Help

| Channel | Link |
|---------|------|
| Bug reports & feature requests | [GitHub Issues](https://github.com/nootus/OpenTax/issues) |
| Browse the source | [github.com/nootus/OpenTax](https://github.com/nootus/OpenTax) |
| Email | [connect@indiatax.ai](mailto:connect@indiatax.ai) |
| Powered by | [IndiaTax.AI](https://indiatax.ai) |

If something is broken or unclear, opening a GitHub issue is the fastest way to get a response.

---

## License

Apache License 2.0

---

<p align="center">
  <a href="https://indiatax.ai"><img src="web/public/logo.webp" alt="Powered by IndiaTax.AI" height="28" /></a><br/>
  <a href="https://indiatax.ai">Powered by IndiaTax.AI</a>
</p>
