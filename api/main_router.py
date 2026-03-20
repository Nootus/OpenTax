from fastapi import FastAPI
from filing.filing_controller import FilingController

def add_routes(app: FastAPI):
    # filing controller
    app.include_router(FilingController().router, prefix="/api/filing", tags=["Filing"])
# add_routes
