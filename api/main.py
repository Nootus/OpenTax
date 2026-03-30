import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app_settings import AppSettings
# Add request logging middleware
from starlette.requests import Request
import logging
import sys
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi import HTTPException


# Import exception handlers
from main_router import add_routes


# Initialize app
app = FastAPI(title=AppSettings.PROJECT_NAME)

# CORS setup - MUST be before exception handlers to ensure CORS headers are added to error responses
app.add_middleware(
    CORSMiddleware,
    allow_origins= AppSettings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configure logging to use unbuffered output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True
)

logger = logging.getLogger(__name__)

# Register exception handlers
@app.on_event("startup")
async def startup_event():
    import sys
    import os
    # Force unbuffered output
    os.environ['PYTHONUNBUFFERED'] = '1'
    sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None
    sys.stderr.reconfigure(line_buffering=True) if hasattr(sys.stderr, 'reconfigure') else None
    
    logger.info("="*80)
    logger.info("[STARTUP] Application started - LoggingMiddleware is active")
    logger.info("[STARTUP] All requests will be logged to terminal")
    logger.info("[STARTUP] PYTHONUNBUFFERED: " + os.environ.get('PYTHONUNBUFFERED', 'not set'))
    logger.info("="*80)

# Include API routers
add_routes(app)


# Root endpoint for FrontEnd SPA
BASE_DIR = Path(__file__).resolve().parent
build_dir = BASE_DIR / "frontend"

# Serve static assets
if os.path.isdir(build_dir):
    app.mount('/_next', StaticFiles(directory=build_dir / '_next'), name='next')
    app.mount('/static', StaticFiles(directory=build_dir / '_next' / 'static'), name='static')

# Serve index.html for root
@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return FileResponse(build_dir / "index.html")

@app.api_route("/about", methods=["GET", "HEAD"])
def read_about():
    return FileResponse(build_dir / "about.html")


# Below is used in production deployments to serve the SPA and handle client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str, request: Request):

    # 1. If it's an API route → let FastAPI handle it
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API route not found")

    # 2. If a static HTML file exists → serve it
    file_path = build_dir / full_path

    # Scenario: /login → /login/index.html
    if file_path.is_dir():
        parent = file_path.parent
        index_file =  parent / f"{file_path.name}.html"
        if index_file.exists():
            return FileResponse(index_file)

    # Scenario: /about.html
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # 3. Fallback → serve index.html for client-side routing
    return FileResponse(build_dir / "index.html")

