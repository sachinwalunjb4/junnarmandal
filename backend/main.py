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
# Define the origins that are allowed to see your backend
origins = [
    "https://junnarmandal-frontend.vercel.app",  # Your frontend production URL
    "http://localhost:3000",                     # Highly recommended for local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
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
