import os
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv

from routers.screening import router as screening_router
from routers.mapping import router as mapping_router

load_dotenv()

app = FastAPI(title="oh-my-jobapplication AI Backend", version="0.1.0")

# CORS — restrict to known origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# API key authentication
API_KEY = os.getenv("AI_API_KEY", "")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str | None = Security(api_key_header)):
    if not API_KEY:
        # No API key configured — allow (dev mode)
        return
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


app.include_router(
    screening_router, prefix="/screening", tags=["screening"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    mapping_router, prefix="/mapping", tags=["mapping"],
    dependencies=[Depends(verify_api_key)],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
