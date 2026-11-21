import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from backend.main import root, app
from backend.api.routes.health import health_check, system_telemetry
from backend.api.routes.semantic import list_supported_domains
import pandas as pd
import numpy as np

def run_sync(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

def test_root_endpoint():
    res = run_sync(root())
    assert res["status"] == "running"
    assert "version" in res
    assert "OmniBI" in res["service"]

def test_health_check_endpoint():
    res = run_sync(health_check())
    assert res["status"] == "healthy"
    assert "OmniBI" in res["service"]
    assert "timestamp" in res
    assert "python_version" in res

def test_system_telemetry():
    res = run_sync(system_telemetry())
    assert res["pandas_version"] == pd.__version__
    assert res["numpy_version"] == np.__version__
    assert res["status"] == "ready"
    assert "FastAPI" in res["backend_engine"]

def test_semantic_domains():
    res = run_sync(list_supported_domains())
    assert "domains" in res
    assert len(res["domains"]) >= 8
    domain_ids = [d["id"] for d in res["domains"]]
    assert "ecommerce" in domain_ids
    assert "saas" in domain_ids
    assert "financial" in domain_ids
    assert "sales" in domain_ids
    assert "marketing" in domain_ids

def test_cors_configuration():
    cors_middleware = next((m for m in app.user_middleware if "CORSMiddleware" in str(m.cls)), None)
    assert cors_middleware is not None
    assert cors_middleware.kwargs["allow_credentials"] is True
    assert "http://localhost:5173" in cors_middleware.kwargs["allow_origins"]
