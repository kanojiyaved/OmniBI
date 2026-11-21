"""
Universal AI Business Intelligence Platform - Export API Routes
==============================================================
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd
from backend.core.exporter import (
    export_dataframe_to_csv,
    export_dataframe_to_excel,
    sanitize_formula_injection,
    mask_pii_value,
)

router = APIRouter()


class ExportCSVRequest(BaseModel):
    records: List[Dict[str, Any]]
    columns: Optional[List[str]] = None
    delimiter: str = ","
    sanitize_formulas: bool = True
    mask_pii: bool = False
    filename: Optional[str] = "omnibi_export.csv"


class ExportExcelRequest(BaseModel):
    records: List[Dict[str, Any]]
    kpis: Optional[List[Dict[str, Any]]] = None
    profiles: Optional[Dict[str, Any]] = None
    sanitize_formulas: bool = True
    mask_pii: bool = False
    filename: Optional[str] = "omnibi_export.xlsx"


class ExportReportRequest(BaseModel):
    dataset_name: str
    records: List[Dict[str, Any]]
    kpis: Optional[List[Dict[str, Any]]] = None
    profiles: Optional[Dict[str, Any]] = None


@router.post("/csv")
async def api_export_csv(request: ExportCSVRequest):
    """Generates sanitized CSV with configurable delimiter and formula injection mitigation."""
    if not request.records:
        df = pd.DataFrame(columns=request.columns or [])
    else:
        df = pd.DataFrame(request.records)
        if request.columns:
            # Reorder or select specified columns
            existing_cols = [c for c in request.columns if c in df.columns]
            df = df[existing_cols]

    csv_content = export_dataframe_to_csv(
        df=df,
        delimiter=request.delimiter,
        sanitize_formulas=request.sanitize_formulas,
        mask_pii=request.mask_pii,
    )

    filename = request.filename or "export.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/excel")
async def api_export_excel(request: ExportExcelRequest):
    """Generates multi-sheet Excel (.xlsx) file with Records, KPIs, and Profiling sheets."""
    df = pd.DataFrame(request.records) if request.records else pd.DataFrame()
    buffer = export_dataframe_to_excel(
        df=df,
        kpis=request.kpis,
        profiles=request.profiles,
        sanitize_formulas=request.sanitize_formulas,
        mask_pii=request.mask_pii,
    )

    filename = request.filename or "export.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/report")
async def api_export_report_summary(request: ExportReportRequest):
    """Produces structured JSON executive report payload."""
    df = pd.DataFrame(request.records) if request.records else pd.DataFrame()
    return {
        "status": "success",
        "dataset_name": request.dataset_name,
        "record_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "kpis": request.kpis or [],
        "profiles": request.profiles or {},
    }
