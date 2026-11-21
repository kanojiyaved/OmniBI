from datetime import datetime, timezone
import sys
import pandas as pd
import numpy as np
from fastapi import APIRouter
from backend.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """System health verification endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "python_version": settings.PYTHON_VERSION,
        "environment": "development"
    }

@router.get("/health/system")
async def system_telemetry():
    """Returns runtime telemetry including Pandas and NumPy versions."""
    return {
        "python_version": settings.PYTHON_VERSION,
        "pandas_version": pd.__version__,
        "numpy_version": np.__version__,
        "backend_engine": "FastAPI + Uvicorn Async Architecture",
        "status": "ready"
    }
