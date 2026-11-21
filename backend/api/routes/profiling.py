from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
from backend.core.profiler import profile_dataframe
from backend.core.cleaner import clean_dataframe

router = APIRouter()

class ProfileRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: Optional[List[str]] = None

class CleanRequest(BaseModel):
    data: List[Dict[str, Any]]
    action_type: str
    params: Dict[str, Any] = {}

@router.post("/analyze")
async def analyze_dataset(req: ProfileRequest):
    """Profiles dataset records using Pandas statistical analysis."""
    if not req.data or len(req.data) == 0:
        return {
            "quality": {
                "overallScore": 0,
                "totalRows": 0,
                "totalColumns": 0,
                "duplicateRowsCount": 0,
                "missingCellsCount": 0,
                "missingDataPercentage": 0,
                "anomaliesDetected": []
            },
            "profiles": {}
        }
    
    df = pd.DataFrame(req.data)
    result = profile_dataframe(df)
    return result

@router.post("/clean")
async def apply_cleaning(req: CleanRequest):
    """Executes a pure functional cleaning action on the dataset."""
    df = pd.DataFrame(req.data)
    result = clean_dataframe(df, req.action_type, req.params)
    return result
