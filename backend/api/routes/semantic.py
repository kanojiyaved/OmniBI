from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.core.semantic_mapper import (
    DOMAIN_ONTOLOGY,
    detect_business_domain,
    map_column_roles,
    generate_understanding_report
)

router = APIRouter()

class DomainDetectionRequest(BaseModel):
    columns: List[str]
    sample_data: Optional[List[Dict[str, Any]]] = None

class ColumnMappingRequest(BaseModel):
    columns: List[str]
    sample_data: Optional[List[Dict[str, Any]]] = None
    domain: Optional[str] = "general"

class UnderstandingReportRequest(BaseModel):
    columns: List[str]
    domain: Optional[str] = "general"
    mappings: Dict[str, Dict[str, Any]]
    row_count: Optional[int] = 1000

@router.get("/domains")
async def list_supported_domains():
    """Returns catalog of supported business domains for semantic mapping."""
    return {
        "domains": [
            {
                "id": domain_id,
                "name": info["label"],
                "primary_metrics": info["primary_metrics"],
                "dimensions": info["dimensions"]
            }
            for domain_id, info in DOMAIN_ONTOLOGY.items()
        ]
    }

@router.post("/detect-domain")
async def api_detect_domain(payload: DomainDetectionRequest):
    """Classifies dataset columns into a business domain with confidence score."""
    result = detect_business_domain(payload.columns, payload.sample_data)
    return result

@router.post("/map-columns")
async def api_map_columns(payload: ColumnMappingRequest):
    """Maps dataset columns to semantic roles based on domain ontology."""
    mappings = map_column_roles(payload.columns, payload.sample_data, payload.domain or "general")
    return {"mappings": mappings}

@router.post("/understanding-report")
async def api_understanding_report(payload: UnderstandingReportRequest):
    """Generates an AI dataset understanding report describing metrics and module availability."""
    report = generate_understanding_report(
        columns=payload.columns,
        domain=payload.domain or "general",
        mappings=payload.mappings,
        row_count=payload.row_count or 1000
    )
    return report

