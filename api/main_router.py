from fastapi import FastAPI

def add_routes(app: FastAPI):
    # filing controller
    app.include_router(FilingController().router, prefix="/api/filing", tags=["Filing"])
# add_routes
