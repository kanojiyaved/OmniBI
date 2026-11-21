from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api.routes import health, dataset, analytics, semantic, profiling, ai_analyst, export

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Universal AI-Powered Dynamic Business Intelligence Platform - Python Backend Engine",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix=f"{settings.API_V1_STR}", tags=["Health"])
app.include_router(dataset.router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Datasets"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(semantic.router, prefix=f"{settings.API_V1_STR}/semantic", tags=["Semantic Mapping"])
app.include_router(profiling.router, prefix=f"{settings.API_V1_STR}/profiling", tags=["Profiling & Cleaning"])
app.include_router(ai_analyst.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Analyst"])
app.include_router(export.router, prefix=f"{settings.API_V1_STR}/export", tags=["Export & Storage"])

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "running"
    }
