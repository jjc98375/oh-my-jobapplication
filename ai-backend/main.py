from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.screening import router as screening_router
from routers.mapping import router as mapping_router

load_dotenv()

app = FastAPI(title="oh-my-jobapplication AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screening_router, prefix="/screening", tags=["screening"])
app.include_router(mapping_router, prefix="/mapping", tags=["mapping"])


@app.get("/health")
async def health():
    return {"status": "ok"}
