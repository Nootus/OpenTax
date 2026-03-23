# 🛠️ OpenTax Technical Documentation

This document provides a complete technical overview of the OpenTax codebase — including architecture, project structure, development workflow, environment setup, testing, and deployment.  
It is intended for developers contributing to the frontend, backend, or tax‑logic engine.

---

# 📁 Project Structure

OpenTax/  
├── web/          Next.js 16 frontend — React 19, TypeScript 5.9, Tailwind CSS 4  
├── api/          Python 3.12 FastAPI backend — tax calculation, ITR building, validation  
└── README.md  

---

# 🌐 Frontend — web/

The frontend is built using:

- Next.js 16  
- React 19  
- TypeScript 5.9  
- Tailwind CSS 4  
- Turbopack for fast development builds  
- Static export for production deployments  

---

## 📦 Installation

cd web  
npm install  

---

## ▶️ Development

npm run dev  

The application runs at:

http://localhost:3000

The frontend expects the backend API at:

http://localhost:8000

Configured in `web/.env`:

NEXT_PUBLIC_API_URL=http://localhost:8000

---

## 🏗️ Build

npm run build  

This produces a static export in:

web/out/

During production deployment, this directory is copied into:

api/frontend/

and served by the FastAPI backend.

---

## 🧹 Lint

npm run lint  

---

## 📜 Scripts Reference

Script | Command | Description  
-------|---------|-------------  
dev | npm run dev | Start Next.js development server with Turbopack  
build | npm run build | Produce static export to out/  
start | npm start | Start Next.js production server  
lint | npm run lint | Run ESLint  

---

# 🧩 Backend — api/

The backend is a FastAPI service running on Python 3.12.  
It powers:

- The tax calculation engine  
- ITR JSON construction  
- Validation rules  
- Serving the static frontend in production  

A detailed backend guide is available in:

api/README.md

---

# 🧪 Testing (Backend)

The backend uses:

- pytest for unit tests  
- coverage for test coverage  
- scenario-based tests for tax logic  

Run tests:

cd api  
pytest  

Run with coverage:

pytest --cov=.  

---

# 🔧 Environment Setup

## Python Environment

cd api  
python -m venv venv  
source venv/bin/activate     # Linux/macOS  
venv\Scripts\activate        # Windows  

pip install -r requirements.txt  

---

# 🚀 Running Both Services Together

## One-command launch (Windows)

A PowerShell script is included to start both servers and open the browser automatically:

.\start.ps1  

This:

- Opens two terminal windows (API + frontend)  
- Waits for both to be ready  
- Launches http://localhost:3000 in Chrome  

---

## Manual Start

Open two terminal sessions from the repository root.

### Terminal 1 — API

cd api  
python -m uvicorn main:app --reload --port 8000  

### Terminal 2 — Frontend

cd web  
npm run dev  

Access the application at:

http://localhost:3000

---

# 🏗️ Deployment Notes

## Production Deployment Strategy

- The frontend is statically exported (web/out/)  
- The backend serves the static files from api/frontend/  
- A single FastAPI process handles:  
  - API routes  
  - Static asset delivery  
  - ITR computation engine  

## Recommended Stack

- Uvicorn + Gunicorn for backend  
- Nginx reverse proxy  
- Systemd for service management  
- Docker (optional) for containerized deployments  

---

# 🧠 Developer Conventions

## Code Style

- Frontend: ESLint + Prettier  
- Backend: Black + Pylint  

## Commit Messages (Conventional Commits)

feat: add support for section 80D  
fix: correct HRA exemption calculation  
docs: update API usage examples  
refactor: simplify tax slab logic  

## Branch Naming

feature/<name>  
bugfix/<name>  
taxrule/<section>  
docs/<name>  

---

# 🧩 Architecture Overview

## Frontend Architecture

- Stateless UI  
- API-driven  
- Form-based tax data collection  
- Client-side validation + server-side validation  
- Static export for production  

## Backend Architecture

- Modular tax engine  
- Deterministic rule evaluation  
- ITR builder aligned with CBDT schema  
- Validation layer with rule-based checks  
- Versioned tax logic (future roadmap)  
- Serves static frontend in production  

---

# 📚 Additional Documentation

- CONTRIBUTING.md — contribution workflow  
- api/README.md — backend API documentation  
- ROADMAP.md — future development plans  

---

If you're contributing to the tax engine, please read the Tax Logic Guidelines in <a href='contribution.md'>CONTRIBUTING.md</a>.
