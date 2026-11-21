import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import asyncio
import httpx
from backend.main import app
import pandas as pd
import numpy as np

async def run_all():
    print("Executing Backend Test Suite...")
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Test 1: Root
        r1 = await client.get("/")
        assert r1.status_code == 200, f"Root failed: {r1.status_code}"
        assert r1.json()["status"] == "running"
        print("✓ test_root_endpoint PASSED")

        # Test 2: Health
        r2 = await client.get("/api/v1/health")
        assert r2.status_code == 200, f"Health check failed: {r2.status_code}"
        assert r2.json()["status"] == "healthy"
        assert "timestamp" in r2.json()
        print("✓ test_health_check_endpoint PASSED")

        # Test 3: System Telemetry
        r3 = await client.get("/api/v1/health/system")
        assert r3.status_code == 200, f"System telemetry failed: {r3.status_code}"
        data3 = r3.json()
        assert data3["pandas_version"] == pd.__version__
        assert data3["numpy_version"] == np.__version__
        assert data3["status"] == "ready"
        print("✓ test_system_telemetry PASSED")

        # Test 4: Semantic Domains Catalog
        r4 = await client.get("/api/v1/semantic/domains")
        assert r4.status_code == 200, f"Semantic domains failed: {r4.status_code}"
        domains = r4.json()["domains"]
        assert len(domains) >= 8
        domain_ids = [d["id"] for d in domains]
        assert "ecommerce" in domain_ids
        assert "saas" in domain_ids
        assert "financial" in domain_ids
        print("✓ test_semantic_domains PASSED")

        # Test 5: CORS Configuration
        r5 = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert r5.status_code == 200, f"CORS failed: {r5.status_code}"
        assert r5.headers.get("access-control-allow-origin") == "http://localhost:5173"
        print("✓ test_cors_headers PASSED")

    print("\n==========================================")
    print("BACKEND TEST SUITE: 5/5 PASSED SUCCESSFULLY")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_all())
