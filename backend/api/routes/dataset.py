from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter()

class IngestResponse(BaseModel):
    message: str
    status: str
    dataset_id: Optional[str] = None
    row_count: int = 0
    column_count: int = 0

@router.get("/datasets")
async def list_datasets():
    """Lists mounted dataset identifiers in the backend cache."""
    return {
        "datasets": [],
        "count": 0,
        "status": "ready"
    }
