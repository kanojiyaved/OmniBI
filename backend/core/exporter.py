"""
Universal AI Business Intelligence Platform - Python Export Engine
==================================================================
Handles enterprise export generation, multi-sheet openpyxl Excel workbooks,
formula injection sanitization (CWE-1236), and sensitive PII data masking.
"""

import io
import re
from typing import Any, Dict, List, Optional
import pandas as pd

DANGEROUS_FORMULA_REGEX = re.compile(r"^\s*[=+\-@\t\r%]")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-().]{7,20}$")
CREDIT_CARD_REGEX = re.compile(r"^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$")


def sanitize_formula_injection(val: Any) -> Any:
    """Neutralizes formula injection triggers (=, +, -, @, \\t, \\r, %) by prepending a single quote."""
    if isinstance(val, str) and DANGEROUS_FORMULA_REGEX.match(val):
        return f"'{val}"
    return val


def mask_email(email: str) -> str:
    """Masks an email address preserving first and last chars of local part."""
    parts = email.split("@")
    if len(parts) != 2:
        return "***@***.***"
    local, domain = parts
    if len(local) <= 2:
        return f"{local[0]}*@{domain}"
    masked_local = f"{local[0]}{'*' * min(len(local) - 2, 4)}{local[-1]}"
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """Masks phone number retaining only last 4 digits."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "***-****"
    return f"***-***-{digits[-4:]}"


def mask_credit_card(cc: str) -> str:
    """Masks payment card number retaining only last 4 digits."""
    cleaned = re.sub(r"[\s-]", "", cc)
    if len(cleaned) < 4:
        return "****-****-****-****"
    return f"****-****-****-{cleaned[-4:]}"


def mask_pii_value(val: Any) -> Any:
    """Checks if value matches PII patterns and applies masking."""
    if not isinstance(val, str) or not val.strip():
        return val
    s = val.strip()

    if EMAIL_REGEX.match(s):
        return mask_email(s)

    cc_candidate = re.sub(r"[\s-]", "", s)
    if re.match(r"^\d{13,19}$", cc_candidate) and CREDIT_CARD_REGEX.match(cc_candidate):
        return mask_credit_card(s)

    if PHONE_REGEX.match(s):
        digits = re.sub(r"\D", "", s)
        if 7 <= len(digits) <= 15:
            return mask_phone(s)

    return val


def sanitize_dataframe(
    df: pd.DataFrame,
    sanitize_formulas: bool = True,
    mask_pii: bool = False,
) -> pd.DataFrame:
    """Vectorized sanitization of DataFrame values."""
    sanitized = df.copy()

    for col in sanitized.columns:
        if mask_pii:
            sanitized[col] = sanitized[col].apply(mask_pii_value)
        if sanitize_formulas:
            sanitized[col] = sanitized[col].apply(sanitize_formula_injection)

    return sanitized


def export_dataframe_to_csv(
    df: pd.DataFrame,
    delimiter: str = ",",
    sanitize_formulas: bool = True,
    mask_pii: bool = False,
) -> str:
    """Exports DataFrame to formatted CSV string with UTF-8 BOM."""
    clean_df = sanitize_dataframe(df, sanitize_formulas=sanitize_formulas, mask_pii=mask_pii)
    output = io.StringIO()
    clean_df.to_csv(output, sep=delimiter, index=False)
    csv_str = output.getvalue()
    # Prepend UTF-8 BOM
    return "\ufeff" + csv_str


def export_dataframe_to_excel(
    df: pd.DataFrame,
    kpis: Optional[List[Dict[str, Any]]] = None,
    profiles: Optional[Dict[str, Any]] = None,
    sanitize_formulas: bool = True,
    mask_pii: bool = False,
) -> io.BytesIO:
    """Generates multi-sheet Excel workbook with Records, KPIs, and Profiling sheets."""
    clean_df = sanitize_dataframe(df, sanitize_formulas=sanitize_formulas, mask_pii=mask_pii)
    buffer = io.BytesIO()

    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        # Sheet 1: Records
        clean_df.to_excel(writer, sheet_name="Records", index=False)

        # Sheet 2: Executive KPIs
        if kpis:
            kpi_rows = []
            for k in kpis:
                kpi_rows.append({
                    "Metric ID": k.get("id", ""),
                    "Metric Name": k.get("name", ""),
                    "Calculated Value": k.get("value", 0),
                    "Aggregation": str(k.get("aggregation", "")).upper(),
                    "Target Column": k.get("targetColumn", "All"),
                    "Formula": k.get("formula", ""),
                })
            kpi_df = pd.DataFrame(kpi_rows)
            kpi_df.to_excel(writer, sheet_name="Executive KPIs", index=False)

        # Sheet 3: Data Profiling
        if profiles:
            profile_rows = []
            for col, p in profiles.items():
                profile_rows.append({
                    "Column Name": col,
                    "Inferred Type": p.get("inferredType", "text"),
                    "Semantic Role": p.get("semanticRole", "attribute"),
                    "Distinct Count": p.get("distinctCount", 0),
                    "Null Count": p.get("nullCount", 0),
                    "Min": p.get("min", "N/A"),
                    "Max": p.get("max", "N/A"),
                    "Mean": p.get("mean", "N/A"),
                })
            profile_df = pd.DataFrame(profile_rows)
            profile_df.to_excel(writer, sheet_name="Data Profiling", index=False)

    buffer.seek(0)
    return buffer
