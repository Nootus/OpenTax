<p align="center">
  <img src="../web/public/ITAI-logo.png" alt="OpenTax" height="72" />
</p>

<h1 align="center">OpenTax API</h1>

<p align="center">
  <a href="https://indiatax.ai"><img src="../web/public/logo.webp" alt="Powered by IndiaTax.AI" height="32" /></a><br/>
  <a href="https://indiatax.ai"><strong>Powered by IndiaTax.AI</strong></a>
</p>

<br/>

FastAPI backend service for the OpenTax application. Responsible for tax computation under Old and New regimes, ITR-1 JSON construction, and validation.

---

## Prerequisites

- Python 3.12.10 or later
- pip 23 or later (bundled with Python)

---

## Setup

### 1. Create a virtual environment

```bash
cd api
python -m venv .venv
```

### 2. Activate the virtual environment

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the development server

```bash
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Interactive documentation (Swagger UI) is served at `http://localhost:8000/docs`.

---

## Environment Variables

Environment variables are loaded automatically via `pydantic-settings`. They can be set in a `.env` file in the `api/` directory or as system environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_NAME` | `Open Tax` | Application name shown in OpenAPI docs |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed CORS origins |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi[standard] | 0.121.3 | Web framework and request routing |
| uvicorn[standard] | 0.38.0 | ASGI server |
| pydantic[email] | 2.12.4 | Data validation and serialisation |
| pydantic-settings | 2.12.0 | Environment-based configuration |
| python-dotenv | 1.2.1 | `.env` file loading |

---

## API Endpoints

All endpoints are prefixed with `/api/filing`.

### POST /api/filing/calculate_tax

Accepts a complete `FilingModel` payload, runs tax computation for both Old and New regimes, and returns the filing model with the `tax_computation` field populated.

**Request body:** `FilingModel` (JSON)

**Response:** `FilingModel` (JSON) with `taxComputation` populated

**Example:**
```bash
curl -X POST http://localhost:8000/api/filing/calculate_tax \
  -H "Content-Type: application/json" \
  -d @filing.json
```

---

### POST /api/filing/get_itr1

Builds the complete ITR-1 JSON from the filing data. Returns validation errors if the filing is incomplete or inconsistent, or the full ITR-1 summary on success.

**Request body:** `FilingModel` (JSON)

**Response:** `ValidationResponse` (JSON)

```json
{
  "success": true,
  "validationErrors": [],
  "totalErrors": 0,
  "itrSummary": { ... }
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/filing/get_itr1 \
  -H "Content-Type: application/json" \
  -d @filing.json
```

---

## Project Structure

```
api/
├── main.py                  Application entry point, FastAPI instance, CORS, static file serving
├── main_router.py           Route registration
├── app_settings.py          Pydantic-settings configuration
├── requirements.txt         Python dependencies
├── filing/
│   ├── filing_controller.py API route handlers
│   ├── models/              Pydantic request/response models (FilingModel and all sub-models)
│   ├── itr/
│   │   ├── itr_building_orchestrator.py  ITR-1 vs ITR-2 selector and build coordinator
│   │   ├── itr1/            ITR-1 building service and ITR-1 Pydantic models
│   │   └── validations/     Validation rules and ValidationResponse model
│   ├── tax_calculation/     Tax computation engine (Old and New regime)
│   └── utils/               Shared utilities (age computation, filing helpers)
```

---

## Production Deployment

Build the frontend and copy the static output into the API directory:

```bash
cd web
npm run build
```

Then copy or move `web/out/` to `api/frontend/`. The FastAPI application will automatically detect and serve the static files, handling SPA client-side routing for all non-API paths.

Start the production server:

```bash
cd api
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## License

Apache License 2.0

---

<p align="center">
  <a href="https://indiatax.ai"><img src="../web/public/logo.webp" alt="Powered by IndiaTax.AI" height="28" /></a><br/>
  <a href="https://indiatax.ai">Powered by IndiaTax.AI</a>
</p>
