"""
Stage 10: Backend Export, Storage & Security Tests
=================================================
Validates CSV export, multi-sheet Excel generation, formula injection neutralization,
and PII masking logic.
"""

import io
import pytest
import pandas as pd
import openpyxl
from backend.core.exporter import (
    sanitize_formula_injection,
    mask_email,
    mask_phone,
    mask_credit_card,
    mask_pii_value,
    sanitize_dataframe,
    export_dataframe_to_csv,
    export_dataframe_to_excel,
)
from backend.api.routes.export import (
    api_export_csv,
    api_export_excel,
    api_export_report_summary,
    ExportCSVRequest,
    ExportExcelRequest,
    ExportReportRequest,
)


def run_sync(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


def test_formula_injection_sanitization():
    # Formulas starting with dangerous prefixes must be prepended with '
    assert sanitize_formula_injection("=cmd|' /C calc'!A0") == "'=cmd|' /C calc'!A0"
    assert sanitize_formula_injection("+SUM(A1:A10)") == "'+SUM(A1:A10)"
    assert sanitize_formula_injection("-2+3*cmd") == "'-2+3*cmd"
    assert sanitize_formula_injection("@SUM(B2)") == "'@SUM(B2)"
    assert sanitize_formula_injection("\tDDE_ATTACK") == "'\tDDE_ATTACK"
    assert sanitize_formula_injection("%0Acmd") == "'%0Acmd"

    # Safe strings and numbers must remain unchanged
    assert sanitize_formula_injection("Normal Text") == "Normal Text"
    assert sanitize_formula_injection(1234) == 1234
    assert sanitize_formula_injection(45.67) == 45.67
    assert sanitize_formula_injection(True) is True


def test_pii_masking_rules():
    # Email masking
    masked_email = mask_email("alexander.smith@example.com")
    assert masked_email.startswith("a")
    assert masked_email.endswith("@example.com")
    assert "*" in masked_email
    assert "smith" not in masked_email

    # Phone masking
    masked_phone = mask_phone("+1 (555) 234-5678")
    assert masked_phone == "***-***-5678"

    # Credit card masking
    masked_cc = mask_credit_card("4532-1234-5678-9010")
    assert masked_cc == "****-****-****-9010"

    # Generalized mask_pii_value function
    assert mask_pii_value("user@domain.org").endswith("@domain.org")
    assert mask_pii_value("Standard Product Name") == "Standard Product Name"


def test_export_csv_generation():
    df = pd.DataFrame([
        {"id": 1, "name": "=MALICIOUS_CMD()", "email": "test@corp.com", "revenue": 1000},
        {"id": 2, "name": "Safe Item", "email": "admin@corp.com", "revenue": 2500},
    ])

    csv_output = export_dataframe_to_csv(
        df=df,
        delimiter=";",
        sanitize_formulas=True,
        mask_pii=True,
    )

    # Must contain UTF-8 BOM
    assert csv_output.startswith("\ufeff")
    # Must use semicolon delimiter
    assert ";" in csv_output
    # Formula injection neutralized
    assert "'=MALICIOUS_CMD()" in csv_output
    # Email masked
    assert "test@corp.com" not in csv_output


def test_export_excel_multi_sheet_generation():
    df = pd.DataFrame([
        {"product": "Enterprise Cloud", "amount": 50000, "stage": "=ATTACK"},
        {"product": "Security Suite", "amount": 25000, "stage": "Closed Won"},
    ])

    kpis = [
        {"id": "kpi_rev", "name": "Total Pipeline", "value": 75000, "aggregation": "sum", "formula": "SUM(amount)"}
    ]

    profiles = {
        "product": {"inferredType": "text", "distinctCount": 2, "nullCount": 0},
        "amount": {"inferredType": "currency", "min": 25000, "max": 50000, "mean": 37500},
    }

    excel_buffer = export_dataframe_to_excel(
        df=df,
        kpis=kpis,
        profiles=profiles,
        sanitize_formulas=True,
    )

    # Verify openpyxl can read the generated workbook
    wb = openpyxl.load_workbook(excel_buffer)
    sheet_names = wb.sheetnames

    assert "Records" in sheet_names
    assert "Executive KPIs" in sheet_names
    assert "Data Profiling" in sheet_names

    records_sheet = wb["Records"]
    # Check that stage value was neutralized
    stage_cell_val = records_sheet.cell(row=2, column=3).value
    assert stage_cell_val == "'=ATTACK"

    kpi_sheet = wb["Executive KPIs"]
    assert kpi_sheet.cell(row=2, column=2).value == "Total Pipeline"


def test_api_export_csv_endpoint():
    req = ExportCSVRequest(
        records=[
            {"deal": "Deal A", "val": 100, "tag": "@THREAT"},
            {"deal": "Deal B", "val": 200, "tag": "Safe"},
        ],
        delimiter=",",
        sanitize_formulas=True,
        filename="custom_deals.csv",
    )

    resp = run_sync(api_export_csv(req))
    assert resp.media_type == "text/csv"
    assert 'filename="custom_deals.csv"' in resp.headers["Content-Disposition"]
    assert "'@THREAT" in resp.body.decode("utf-8")


def test_api_export_excel_endpoint():
    req = ExportExcelRequest(
        records=[{"sku": "SKU-1", "price": 49.99}],
        kpis=[{"id": "k1", "name": "Average Price", "value": 49.99, "aggregation": "avg"}],
        filename="inventory_snapshot.xlsx",
    )

    resp = run_sync(api_export_excel(req))
    assert resp.media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert 'filename="inventory_snapshot.xlsx"' in resp.headers["Content-Disposition"]


def test_api_export_report_summary():
    req = ExportReportRequest(
        dataset_name="Quarterly Financials",
        records=[{"rev": 1000}, {"rev": 2000}],
        kpis=[{"id": "rev_sum", "name": "Gross Revenue", "value": 3000}],
    )

    result = run_sync(api_export_report_summary(req))
    assert result["status"] == "success"
    assert result["dataset_name"] == "Quarterly Financials"
    assert result["record_count"] == 2
    assert len(result["kpis"]) == 1


def test_backend_security_and_upload_validation():
    from backend.core.security import (
        validate_file_upload,
        verify_user_permission,
        assert_user_permission,
        enforce_tenant_isolation,
    )
    from fastapi import HTTPException

    # 1. Valid file upload
    validate_file_upload("valid_data.csv", 1024)
    validate_file_upload("quarterly_report.xlsx", 50000)

    # 2. File size exceeds 50MB
    with pytest.raises(HTTPException) as exc_info:
        validate_file_upload("large.csv", 55 * 1024 * 1024)
    assert exc_info.value.status_code == 413

    # 3. Empty file (0 bytes)
    with pytest.raises(HTTPException) as exc_info:
        validate_file_upload("empty.csv", 0)
    assert exc_info.value.status_code == 400

    # 4. Prohibited executable file
    with pytest.raises(HTTPException) as exc_info:
        validate_file_upload("malicious_script.bat", 2048)
    assert exc_info.value.status_code == 400
    assert "strictly prohibited" in exc_info.value.detail

    # 5. RBAC Permissions
    assert verify_user_permission("admin", "dataset:delete") is True
    assert verify_user_permission("analyst", "dataset:delete") is False
    assert verify_user_permission("viewer", "dataset:export") is True
    assert verify_user_permission("viewer", "dataset:clean") is False

    # Assert raises for unauthorized
    with pytest.raises(HTTPException) as exc_info:
        assert_user_permission("viewer", "dataset:delete")
    assert exc_info.value.status_code == 403

    # 6. Tenant isolation
    data = [
        {"id": 1, "tenantId": "t1"},
        {"id": 2, "tenantId": "t2"},
        {"id": 3, "tenantId": "t1"},
    ]
    isolated = enforce_tenant_isolation(data, "t1")
    assert len(isolated) == 2
    assert all(r["tenantId"] == "t1" for r in isolated)

