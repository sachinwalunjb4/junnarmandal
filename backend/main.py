from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.config import get_settings
from app.routers import auth, profiles, search, matches, interests, shortlists, messages, blocks, reports, admin

settings = get_settings()

app = FastAPI(
    title="Marathi Junnar Lagna Mandal API",
    description="REST API for the Junnar Taluka matrimony platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# On Vercel (production), CORS is handled at the edge via vercel.json headers.
# CORSMiddleware is only needed for local development.
if settings.app_env != "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(search.router)
app.include_router(matches.router)
app.include_router(interests.router)
app.include_router(shortlists.router)
app.include_router(messages.router)
app.include_router(blocks.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "Junnar Lagna Mandal API"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}
