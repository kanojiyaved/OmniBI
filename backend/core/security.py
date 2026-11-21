"""
Universal AI Business Intelligence Platform - Backend Security & RBAC
=====================================================================
Enforces role-based authorization, tenant data isolation, and input validation.
"""

from typing import Dict, List, Optional, Set
from fastapi import HTTPException, status

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB

FORBIDDEN_EXTENSIONS: Set[str] = {
    "exe", "bat", "cmd", "sh", "php", "js", "py", "vbs", "msi", "dll", "scr", "bin"
}

ALLOWED_EXTENSIONS: Set[str] = {"csv", "tsv", "txt", "xlsx", "xls", "xlsm"}

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "admin": {
        "dataset:upload",
        "dataset:replace",
        "dataset:delete",
        "dataset:clean",
        "dataset:export",
        "ai:query",
        "storage:purge",
        "security:configure",
    },
    "analyst": {
        "dataset:upload",
        "dataset:replace",
        "dataset:clean",
        "dataset:export",
        "ai:query",
    },
    "viewer": {
        "dataset:export",
        "ai:query",
    },
}


def verify_user_permission(role: str, permission: str) -> bool:
    """Checks if a user role is permitted to perform a specified action."""
    permissions = ROLE_PERMISSIONS.get(role.lower(), set())
    return permission in permissions


def assert_user_permission(role: str, permission: str) -> None:
    """Raises HTTP 403 Forbidden if user role lacks the required permission."""
    if not verify_user_permission(role, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{role}' does not have authorization for '{permission}'.",
        )


def validate_file_upload(filename: str, byte_size: int) -> None:
    """Validates file constraints: size limits, extension whitelisting, and executable blocking."""
    if byte_size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 50MB (received {byte_size / (1024 * 1024):.1f}MB).",
        )

    if byte_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext in FORBIDDEN_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security violation: Executable/script file type '.{ext}' is strictly prohibited.",
        )

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Only CSV, XLSX, and XLS files are permitted.",
        )


def enforce_tenant_isolation(records: List[Dict], tenant_id: str) -> List[Dict]:
    """Filters records strictly to the authenticated tenant."""
    if not tenant_id:
        return records
    return [r for r in records if r.get("tenantId") == tenant_id or "tenantId" not in r]
