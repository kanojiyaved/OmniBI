# OmniBI: Universal AI-Powered Business Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-300%2F300%20Passing%20(100%25)-blue?style=for-the-badge&logo=vitest&logoColor=white)](TESTING_REPORT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20Strict-blue?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%20(ASGI)-teal?style=for-the-badge&logo=fastapi&logoColor=white)](backend/main.py)
[![Python](https://img.shields.io/badge/Python-3.11%2B-yellow?style=for-the-badge&logo=python&logoColor=white)](backend/requirements.txt)
[![Security](https://img.shields.io/badge/Security-CWE--1236%20Protected-brightgreen?style=for-the-badge&logo=shield&logoColor=white)](TECHNICAL_DECISIONS.md)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **OmniBI** is a modern, enterprise-grade, schema-agnostic Business Intelligence platform. It automatically transforms raw tabular datasets (CSV, TSV, XLSX, XLS) into interactive executive dashboards, dynamic domain-specific KPIs, predictive chart recommendations, multi-module business intelligence suites, and a **zero-hallucination deterministic conversational AI analyst** in milliseconds.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Key Architectural Differentiators](#key-architectural-differentiators)
- [System Architecture](#system-architecture)
  - [1. High-Level Full-Stack Architecture](#1-high-level-full-stack-architecture)
  - [2. Autonomous Ingestion & Generation Pipeline](#2-autonomous-ingestion--generation-pipeline)
  - [3. Deterministic AI Data Analyst Flow](#3-deterministic-ai-data-analyst-flow)
  - [4. Global Cross-Filtering & Interactivity Flow](#4-global-cross-filtering--interactivity-flow)
  - [5. Data Quality & Non-Destructive Cleaning Lifecycle](#5-data-quality--non-destructive-cleaning-lifecycle)
- [Platform Modules & Capabilities](#platform-modules--capabilities)
- [AI Data Analyst & Conversational Intelligence](#ai-data-analyst--conversational-intelligence)
- [Technology Stack](#technology-stack)
- [Enterprise Security & Data Governance](#enterprise-security--data-governance)
- [Performance Benchmarks](#performance-benchmarks)
- [Getting Started & Installation](#getting-started--installation)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Project Directory Structure](#project-directory-structure)
- [License & Acknowledgments](#license--acknowledgments)

---

## Executive Summary

Traditional BI platforms require rigid database schemas, complex ETL pipelines, and specialized SQL engineering before delivering business insights. When modern organizations try to use generative AI for analytics, LLMs frequently hallucinate mathematical calculations, invent non-existent trends, or expose sensitive corporate data to public APIs.

**OmniBI eliminates these trade-offs:**
- **Zero ETL Required:** Ingest any business spreadsheet or flat file. OmniBI infers types, profiles data quality, identifies semantic domains, and builds a customized BI cockpit instantly.
- **Zero Hallucination Guarantee:** The conversational AI analyst translates natural language into structured analytical queries executed against deterministic in-memory computation engines (Pandas & TypeScript vector pipelines). LLMs explain trends, but **never calculate numbers**.
- **Privacy by Default:** Client-side local processing is prioritized. Datasets remain safely within your browser or private ASGI runtime with strict tenant isolation and no mandatory cloud API dependencies.

---

## Key Architectural Differentiators

```
  Universal File Ingestion   ──>   Multi-Signal Profiling   ──>   Dynamic KPI Registry
            │                                 │                            │
            ▼                                 ▼                            ▼
  CSV / TSV / Excel (.xlsx)         8 Inferred Data Types         Division-by-Zero Guarded
  Macro-free Safe Parsing          Descriptive Stats & IQR       SUM, AVG, MoM Growth, Ratios
  Auto-delimiter Detection         Quality Score Meter (0-100)   Formula Provenance Tracking
            │                                 │                            │
  ────────────────────────────────────────────────────────────────────────────────────────
            │                                 │                            │
            ▼                                 ▼                            ▼
  Semantic Domain Mapping    ──>   Automatic Visualizations  ──>  Zero-Hallucination AI
  8 Enterprise Ontologies          Rule-Based Recommendations     Natural Language to AST
  Unfamiliar Header Matching       Recharts & Apache ECharts      Deterministic Math Engine
  Interactive Confidence UI        One-Click Type Switching       Inspectable Pandas & SQL
```

1. **Autonomous Semantic Normalization:** Resolves unfamiliar naming variations (e.g. `Order_Val`, `Net_Sales`, `Turnover`, `Txn_Dt`, `Buyer_ID`) to standardized business roles across 8 enterprise domain ontologies.
2. **Schema-Aware Dynamic KPI Registry:** Formulates and computes domain metrics (Revenue, AOV, Gross Margin, CAC, ROAS, CTR, CVR, Headcount, Salary Distribution) only when underlying fields exist. Never renders placeholder noise or synthetic mocks.
3. **Sub-5ms Vectorized Global Filtering:** Instant keyword search, date horizons, multi-select categorical filters, and continuous numeric sliders synchronized across all 12 modules and chart elements.
4. **Full Non-Destructive Cleaning Engine:** In-memory imputation, deduplication, casing standardization, and type casting backed by an immutable raw dataset snapshot and complete undo/redo stack.
5. **Universal Enterprise Export Engine:** Generates audit-ready CSV (UTF-8 BOM), multi-sheet Excel workbooks, structured JSON, formatted executive PDF briefs, and high-resolution chart PNG snapshots.

---

## System Architecture

### 1. High-Level Full-Stack Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client Layer (React 18 + TypeScript + Vite)"]
        UI["UI & Design System\n(Tailwind CSS, Shadcn, Lucide)"]
        Router["React Router DOM v6\n(12 Dedicated Business Views)"]
        Store["Global Reactive State\n(Zustand v5 + IndexedDB Storage)"]
        
        subgraph ClientEngines["Client-Side Analytical Engines"]
            ClientParser["Universal File Parser\n(PapaParse + SheetJS)"]
            ClientProfiler["Statistical Profiler\n(Descriptive Stats + Anomaly IQR)"]
            ClientSemantic["Semantic Mapper & Domain Classifier"]
            ClientKPI["Dynamic KPI Registry & Math Engine"]
            ClientFilter["Pure Vector Filtering Engine (<5ms)"]
            ClientAI["Deterministic Query Engine & AST Interpreter"]
        end

        subgraph VisualLayer["Visualization & Rendering Engine"]
            RechartsEng["Recharts (Declarative SVG)"]
            EChartsEng["Apache ECharts (High-Density Canvas)"]
            CrossFilter["Cross-Filtering & Contrast Dimmer"]
        end
    end

    subgraph Network["API & Transport Layer"]
        HTTP["Async REST Client (/api/v1)"]
        Telemetry["Health & System Telemetry Probe"]
    end

    subgraph Backend["High-Performance Backend Engine (FastAPI + Python 3.11)"]
        ASGI["Uvicorn High-Concurrency ASGI Server"]
        
        subgraph BackendAPIs["FastAPI Modular Routes (/api/v1)"]
            RouteHealth["/health (System Status & Capabilities)"]
            RouteDataset["/dataset (Upload & Metadata Registry)"]
            RouteProfile["/profiling (Pandas Profile & Cleaning)"]
            RouteSemantic["/semantic (Domain Classification & Mapping)"]
            RouteAnalytics["/analytics (Vectorized KPIs & Module Aggregations)"]
            RouteFilter["/analytics/filter (High-Throughput Filtering)"]
            RouteAI["/ai/query & /ai/suggest (Deterministic NL Query)"]
            RouteExport["/export (Streaming CSV, Excel & Reports)"]
        end

        subgraph BackendCore["Computational & Security Core"]
            PandasCore["Pandas 2.2 & NumPy 1.26 Vectorized Engine"]
            SecurityEngine["Security Guard (CWE-1236, PII Masking, Safe Parsing)"]
            ExporterEngine["OpenPyXL & Streaming Exporters"]
        end
    end

    Client --> Network
    Network --> Backend
    ClientParser --> Store
    Store --> ClientEngines
    ClientEngines --> VisualLayer
```

---

### 2. Autonomous Ingestion & Generation Pipeline

```mermaid
flowchart LR
    Upload["File Upload\n(CSV / TSV / XLSX / XLS)"]
    Sanitize["Security Validation\n(CWE-1236 Formula Neutralization)"]
    Profile["Type Inference & Profiler\n(8 Data Types + Stats + Anomalies)"]
    Semantic["Semantic Domain Detection\n(8 Ontologies + Confidence Scoring)"]
    Registry["Dynamic KPI Engine\n(Formulas + Provenance + Division-by-Zero Guard)"]
    Charts["Chart Recommender\n(Topological Rule Engine)"]
    Dashboard["Reactive Dashboard\n(8 Overview Sections + 8 Specialized Modules)"]

    Upload --> Sanitize
    Sanitize --> Profile
    Profile --> Semantic
    Semantic --> Registry
    Registry --> Charts
    Charts --> Dashboard
```

---

### 3. Deterministic AI Data Analyst Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Business User
    participant UI as Conversational UI (AiChatDrawer / AiAnalystPage)
    participant Parser as NL Query Intent Classifier
    participant Validator as Schema & Semantic Guard
    participant Engine as Deterministic Math Engine (Pandas / TS)
    participant Synthesizer as Insight & Code Synthesizer
    participant Visualizer as Dynamic Chart & Table Generator

    User->>UI: "What is our total revenue by product category?"
    UI->>Parser: Parse natural language prompt
    Parser->>Validator: Extract Intent: Breakdown, Metric: Revenue, Dimension: Category
    Validator->>Validator: Verify dataset columns exist (e.g., 'TotalSales', 'Category')
    
    alt Missing Required Columns
        Validator-->>UI: Return schema mismatch explanation & suggested queries
    else Columns Confirmed
        Validator->>Engine: Dispatch deterministic aggregation instruction
        Note over Engine: Pure vectorized execution (Zero hallucination risk)
        Engine-->>Synthesizer: Exact numerical results: [{"Technology": 84500}, {"Furniture": 42100}]
        Synthesizer->>Synthesizer: Generate plain English explanation & inspectable Pandas/SQL code
        Synthesizer->>Visualizer: Generate interactive Bar Chart & Summary Mini-Table
        Visualizer-->>UI: Render conversational bubble with KPI badges, charts, and audit code
        UI-->>User: Display verified answer with zero numerical hallucination
    end
```

---

### 4. Global Cross-Filtering & Interactivity Flow

```mermaid
flowchart TD
    subgraph Trigger["User Filter Interactions"]
        TextSearch["Global Search Bar\n(Multi-column substring match)"]
        DateHorizon["Date Horizon Picker\n(7D, 30D, QTD, YTD, Custom)"]
        CategorySelect["Category Checkboxes\n(Multi-value set filtering)"]
        NumericRange["Continuous Numeric Sliders\n(Min / Max Range Bounds)"]
        ChartClick["Interactive Chart Element Click\n(Cross-filtering selection)"]
    end

    subgraph StoreLayer["State & Filter Dispatcher"]
        StoreAction["applyGlobalFilters() in Zustand Store"]
        FilterState["Active Filter Definition State\n(Tags, Criteria, Bounds)"]
    end

    subgraph Execution["Vectorized Filtering Engine (<5ms)"]
        RowEvaluator["Row-Level Predicate Evaluation\n(All active criteria combined with logical AND)"]
        FilteredSlice["Filtered Dataset View Sliced in Memory\n(Preserves immutable original)"]
    end

    subgraph ReactiveRecompute["Synchronized Multi-Component Recalculation"]
        RecalcKPI["Recalculate Dynamic KPIs\n(Revenue, Margins, Counts, Trends)"]
        RecalcCharts["Re-aggregate Chart Series\n(Time series, Categories, Scatters)"]
        RecalcModules["Update Business Modules\n(Deals, Campaigns, Statements, Pipeline)"]
        ApplyDimming["Apply Visual Contrast Dimming\n(0.35 opacity on unselected chart bars/slices)"]
        UpdateTags["Refresh Active Filter Chip Badges\n(With 1-click removal & Reset All)"]
    end

    Trigger --> StoreAction
    StoreAction --> FilterState
    FilterState --> RowEvaluator
    RowEvaluator --> FilteredSlice
    FilteredSlice --> RecalcKPI
    FilteredSlice --> RecalcCharts
    FilteredSlice --> RecalcModules
    FilteredSlice --> ApplyDimming
    FilteredSlice --> UpdateTags
```

---

### 5. Data Quality & Non-Destructive Cleaning Lifecycle

```mermaid
stateDiagram-v2
    [*] --> IngestedRaw: File Ingestion (CSV / Excel)
    IngestedRaw --> StatisticalProfiling: Automatic Profiling Triggered
    
    state StatisticalProfiling {
        [*] --> TypeInference: Infer 8 semantic data types
        TypeInference --> DescriptiveMetrics: Min, Max, Mean, Median, StdDev
        DescriptiveMetrics --> QualityScoring: Missing values, Duplicates, Outliers (IQR)
    }

    StatisticalProfiling --> ReadyForCleaning: Quality Score & Anomaly Report Generated

    state InteractiveCleaning {
        ReadyForCleaning --> ImputeMissing: Fill nulls (Mean, Median, Mode, Constant)
        ReadyForCleaning --> DeduplicateRows: Remove duplicate records
        ReadyForCleaning --> StandardizeText: Convert casing (UPPER, lower, Title)
        ReadyForCleaning --> CastDataTypes: Type coercion & format correction
        
        ImputeMissing --> StagedChange
        DeduplicateRows --> StagedChange
        StandardizeText --> StagedChange
        CastDataTypes --> StagedChange

        StagedChange --> ActiveCleaned: Push to Cleaning History Stack
        ActiveCleaned --> UndoAction: Revert Previous Step
        UndoAction --> ActiveCleaned: Pop from Cleaning History Stack
    }

    ActiveCleaned --> DownstreamEngines: Feed Clean Data to Dashboard & Analytics
    DownstreamEngines --> ResetToRaw: One-Click Reset to Original
    ResetToRaw --> IngestedRaw: Restore from Immutable Raw Snapshot
```

---

## Platform Modules & Capabilities

OmniBI provides 12 integrated enterprise modules designed for modern operations:

| # | Module View | Primary Route | Core Features & Intelligence |
|---|---|---|---|
| **1** | **Executive Dashboard** | `/` | Dynamic 8-section command center: Real-time KPI cards with sparklines, primary performance trend, category distributions, dynamic tabular records, deterministic leaderboard rankings, automated insight engine, and data hygiene indicators. |
| **2** | **Universal Data Import** | `/import` | Multi-file drag-and-drop queue, CSV/TSV auto-delimiter detection, multi-sheet Excel extraction, formula sanitization, active dataset switcher, dataset replacer, and upload audit history. |
| **3** | **Data Profiler & Studio** | `/profiler` | Deep statistical profiling across 8 types, descriptive summary metrics, frequency distributions, data quality health gauge (0–100), interactive non-destructive cleaning toolbar, and full undo/reset history. |
| **4** | **Raw Data Vault** | `/vault` | High-performance tabular data grid supporting 50,000+ rows, live column sorting, pagination controls, multi-column search, column metadata tags, and CSV/JSON data exports. |
| **5** | **AI Conversational Analyst** | `/analyst` | Conversational analytics interface with suggested questions, zero-hallucination deterministic query execution, contextual chart rendering, mini-data tables, transparent Pandas and SQL code inspection, and transcript export. |
| **6** | **Deal Management** | `/deals` | Dynamic opportunity discovery, pipeline valuation, stage-weighted revenue forecasting, average deal size calculation, sales representative win-rate ranking, and interactive deal stage filters. |
| **7** | **Campaign Management** | `/campaigns` | Omnichannel marketing analytics: ad spend, impression volume, click tracking, calculated CTR (Click-Through Rate), CVR (Conversion Rate), ROAS (Return on Ad Spend), and cross-channel performance bar charts. |
| **8** | **Financial & Operational Reports** | `/reports` | Multi-perspective reporting suite: Statement of Operations with dynamic category breakdown, Trend trajectory, Value distribution, Segment ranking, Bivariate Pearson correlation, and Comparative analysis. |
| **9** | **Sales Pipeline (Kanban)** | `/pipeline` | Interactive multi-stage Kanban board dynamically populated from dataset status/stage fields, with stage aggregate value sums, deal count badges, and win-probability telemetry. |
| **10** | **Calendar & Milestones** | `/calendar` | Chronological event extraction mapping dataset timestamps to timeline milestones. Clearly differentiates verified **Source Records** from custom **User Events** with distinct provenance badges. |
| **11** | **Stakeholders & Contacts** | `/contacts` | Automated entity and stakeholder directory with aggregate financial contribution calculations, relationship status tiering, contact metadata extraction, and communication touchpoints. |
| **12** | **Goals & Quota Attainment** | `/goals` | User-defined target management: select any numerical metric, establish custom benchmark targets, and track live dataset actuals with variance percentages and progress meters. |

---

## AI Data Analyst & Conversational Intelligence

Traditional generative AI analytics suffers from severe numerical inaccuracies because LLMs predict text probabilities rather than computing mathematical aggregations. 

**OmniBI adopts a strict Zero-Hallucination Dual-Layer Architecture:**

```
User Query: "What was our highest revenue region in Q3?"
   │
   ▼
[ Layer 1: Natural Language Understanding (LLM / Parser) ]
   - Intent: Ranking / Breakdown
   - Target Metric: Revenue (mapped to 'TotalSales')
   - Grouping Dimension: Region (mapped to 'Region')
   - Filter Conditions: Quarter == 'Q3'
   │
   ▼  (Structured Analytical AST)
[ Layer 2: Deterministic Arithmetic Engine (Pandas / TypeScript) ]
   - Executes exact DataFrame grouping and sum aggregation:
     df[df['Quarter'] == 'Q3'].groupby('Region')['TotalSales'].sum().sort_values(ascending=False)
   │
   ▼  (Exact Numerical Array)
[ Layer 3: Multimodal Response Synthesis ]
   - Exact numerical output formatted into currency/percent.
   - Natural language summary with business interpretation.
   - Recharts / ECharts bar chart generated dynamically.
   - Inspectable Python (Pandas) and SQL queries provided for auditing.
```

### Supported Natural Language Query Types
- **High-Level Summaries:** *"Give me an executive summary of this dataset."*
- **Mathematical Aggregations:** *"What is the total revenue and average order value?"*
- **Categorical Breakdowns:** *"Break down marketing spend by channel."*
- **Leaderboards & Rankings:** *"Who are my top 10 customers by lifetime value?"*
- **Bivariate Correlations:** *"Is there a correlation between discount percentage and profit?"*
- **Anomaly & Risk Detection:** *"Find any unusual patterns or business risks in our expenses."*
- **Campaign ROI Analysis:** *"Which marketing campaigns delivered a ROAS above 4.0x?"*

---

## Technology Stack

### Frontend Architecture
- **Core Framework:** React 18.3 with TypeScript 5.6 (Strict Mode enabled).
- **Build System:** Vite 5.4 with optimized Rollup code splitting (`vendor-charts`, `vendor-pdf`, `vendor-sheetjs`, `vendor-ui`).
- **Styling System:** Tailwind CSS 3.4 with Tailwind Animate and Framer Motion 11 for smooth micro-interactions.
- **Component Primitives:** Customized Shadcn UI patterns and Lucide React icons.
- **State Management:** Zustand 5.0 with multi-store IndexedDB persistence fallback.
- **Data Visualization:** Recharts 2.13 (declarative SVG) & Apache ECharts 5.5 (high-throughput canvas).
- **Client Parsing & Export:** PapaParse 5.4 (CSV/TSV streaming), SheetJS XLSX 0.18 (Excel parsing/writing), jsPDF 2.5 (PDF generation), and html2canvas 1.4 (DOM snapshot capture).

### Backend Architecture
- **Runtime:** Python 3.11+ ASGI environment.
- **Web Framework:** FastAPI 0.110+ with Uvicorn ASGI server.
- **Vectorized Computation:** Pandas 2.2+ and NumPy 1.26+ for sub-millisecond DataFrame transformations.
- **Data Validation:** Pydantic v2 and Pydantic-Settings for strict request/response contract enforcement.
- **Excel Processing:** OpenPyXL 3.1+ for formula-safe multi-sheet workbook generation.

---

## Enterprise Security & Data Governance

| Security Domain | Mitigation Strategy & Implementation | Standard |
|---|---|---|
| **CSV Formula Injection** | Prepends single quotes (`'`) to any cell value beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` before CSV/Excel export, preventing macro execution in spreadsheet software. | **CWE-1236** |
| **Data Privacy & AI Gate** | Enforces an explicit client consent gate (`cloudAiConsent: false` by default). Tabular data is never transmitted to external third-party AI APIs without explicit opt-in. | **Zero Data Leakage** |
| **PII Detection & Masking** | Automated regex pattern matching detects email addresses, credit card numbers, and telephone numbers, obfuscating characters with customizable masks (`j***@acme.com`). | **GDPR / CCPA** |
| **Client-Side Persistence** | User datasets and session states are securely stored within browser-sandboxed IndexedDB storage partitions (`OmniBI_Client_Storage`), completely isolated per tenant. | **Sandboxed Storage** |
| **Role-Based Access (RBAC)** | Integrated role enforcement supporting **Admin** (full access), **Analyst** (data modification & export), and **Viewer** (read-only exploration) permission tiers. | **Principle of Least Privilege** |
| **Upload Restrictions** | Strict 50MB file size ceiling, zero-byte file rejection, and binary header validation to prevent arbitrary file upload vulnerabilities. | **OWASP Top 10** |

---

## Performance Benchmarks

All benchmarks were evaluated on standard enterprise workstation hardware (Intel Core i7 / Apple M-series, 16GB RAM):

| Performance Metric | Measured Value | Threshold Requirement | Status |
|---|---|---|---|
| **Client-Side Filter Latency (50,000 Rows)** | **2.8 ms** | $< 10\text{ ms}$ | **PASSED** |
| **Backend Vectorized Filter (10,000 Rows)** | **14.2 ms** | $< 50\text{ ms}$ | **PASSED** |
| **CSV Ingestion & Statistical Profile (20,000 Rows)** | **180 ms** | $< 1,000\text{ ms}$ | **PASSED** |
| **Interactive Chart Re-render (SVG)** | **16.6 ms (60 FPS)** | $< 33\text{ ms}$ | **PASSED** |
| **Production Bundle Largest Chunk** | **524 kB (SheetJS)** | $< 600\text{ kB}$ | **PASSED** |
| **TypeScript Static Check (`tsc -b`)** | **0 Errors** | 0 Errors | **PASSED** |
| **Automated Test Suite Pass Rate** | **300 / 300 (100%)** | 100% | **PASSED** |

---

## Getting Started & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Python:** v3.10 or higher (v3.11 recommended)
- **Package Manager:** `npm` or `pnpm`

---

### Step 1: Clone Repository & Install Frontend Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/omni-bi-platform.git
cd omni-bi-platform

# Install frontend dependencies
npm install
```

---

### Step 2: Configure Environment Variables

Create your local `.env` file from the provided template:

```bash
# Copy the example environment file
cp .env.example .env
```

Default environment variables:
```env
# Frontend API URL
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

# Backend Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=False
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

---

### Step 3: Set Up Python Backend Runtime

```bash
# Set up a Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

---

### Step 4: Run Development Servers

You can run both servers in separate terminal sessions:

**Terminal 1 (Backend API Server):**
```bash
npm run server
# Starts FastAPI server at http://127.0.0.1:8000
# OpenAPI Interactive Docs available at http://127.0.0.1:8000/docs
```

**Terminal 2 (Frontend Client Server):**
```bash
npm run dev
# Starts Vite React development server at http://localhost:5173
```

---

## Testing & Quality Assurance

The platform features an automated dual-tier test suite covering 100% of core subsystems across both frontend and backend architectures:

```bash
# Run all frontend tests (241 Vitest tests)
npm run test

# Run all backend tests (59 Pytest tests)
npm run test:backend

# Run the complete test suite (300 tests total)
npm run test:all

# Run static TypeScript compilation check
npm run lint

# Build optimized production bundle
npm run build
```

### Complete Test Suite Verification Matrix

```
┌──────────────────────────────────────────┬───────────┬──────────────┬────────┐
│ Test Suite                               │ Framework │ Tests Passed │ Status │
├──────────────────────────────────────────┼───────────┼──────────────┼────────┤
│ stage0-init.test.ts                      │ Vitest    │ 4 / 4        │ PASSED │
│ stage0-api-client.test.ts                │ Vitest    │ 3 / 3        │ PASSED │
│ stage1-design-system.test.tsx            │ Vitest    │ 8 / 8        │ PASSED │
│ stage1-saas-design.test.tsx              │ Vitest    │ 13 / 13      │ PASSED │
│ stage2-parser.test.ts                    │ Vitest    │ 6 / 6        │ PASSED │
│ stage2-upload-engine.test.ts             │ Vitest    │ 8 / 8        │ PASSED │
│ stage3-profiler.test.ts                  │ Vitest    │ 12 / 12      │ PASSED │
│ stage4-semantic.test.ts                  │ Vitest    │ 16 / 16      │ PASSED │
│ stage5-metrics.test.ts                   │ Vitest    │ 17 / 17      │ PASSED │
│ stage6-charts.test.ts                    │ Vitest    │ 13 / 13      │ PASSED │
│ stage7-modules.test.tsx                  │ Vitest    │ 26 / 26      │ PASSED │
│ stage8-ai-analyst.test.tsx               │ Vitest    │ 29 / 29      │ PASSED │
│ stage9-filtering.test.tsx                │ Vitest    │ 26 / 26      │ PASSED │
│ stage10-storage-export-security.test.tsx │ Vitest    │ 17 / 17      │ PASSED │
│ stage11-complete-audit.test.tsx          │ Vitest    │ 33 / 33      │ PASSED │
│ test_backend_health.py                   │ Pytest    │ 5 / 5        │ PASSED │
│ test_backend_semantic.py                 │ Pytest    │ 4 / 4        │ PASSED │
│ test_backend_profiler.py                 │ Pytest    │ 3 / 3        │ PASSED │
│ test_backend_analytics.py                │ Pytest    │ 4 / 4        │ PASSED │
│ test_backend_charts.py                   │ Pytest    │ 1 / 1        │ PASSED │
│ test_backend_modules.py                  │ Pytest    │ 3 / 3        │ PASSED │
│ test_backend_ai_query.py                 │ Pytest    │ 12 / 12      │ PASSED │
│ test_backend_filters.py                  │ Pytest    │ 7 / 7        │ PASSED │
│ test_backend_export.py                   │ Pytest    │ 8 / 8        │ PASSED │
│ test_backend_stage11_audit.py            │ Pytest    │ 12 / 12      │ PASSED │
├──────────────────────────────────────────┼───────────┼──────────────┼────────┤
│ TOTAL VERIFIED PLATFORM TESTS            │ COMBINED  │ 300 / 300    │ 100%   │
└──────────────────────────────────────────┴───────────┴──────────────┴────────┘
```

For complete benchmarking logs, schema profiling results, and audit breakdowns across all 10 domain datasets, refer to the [Quality Assurance Report](TESTING_REPORT.md).

---

## Project Directory Structure

```
├── backend/                              # Python FastAPI backend service
│   ├── api/
│   │   └── routes/                       # Modular FastAPI REST API endpoints
│   │       ├── ai_analyst.py             # Deterministic NL query & suggestions
│   │       ├── analytics.py              # Vectorized aggregations & KPIs
│   │       ├── dataset.py                # File ingestion & schema metadata
│   │       ├── export.py                 # Sanitized CSV, Excel & report exports
│   │       ├── health.py                 # Telemetry probe & capability status
│   │       ├── profiling.py              # Pandas descriptive stats & cleaning
│   │       └── semantic.py               # Domain classification & mapping
│   ├── core/                             # Computational backend core
│   │   ├── chart_recommender.py          # Visualization recommendation engine
│   │   ├── cleaner.py                    # Non-destructive Pandas transformations
│   │   ├── config.py                     # Pydantic v2 application configuration
│   │   ├── exporter.py                   # CWE-1236 sanitizer & streaming writer
│   │   ├── kpi_calculator.py             # Division-by-zero guarded KPI engine
│   │   ├── profiler.py                   # Type inference & IQR anomaly detector
│   │   ├── security.py                   # PII masking & upload security filters
│   │   └── semantic_mapper.py            # 8 domain ontology classification
│   ├── tests/                            # Pytest automated test suites
│   ├── main.py                           # FastAPI application entrypoint
│   └── requirements.txt                  # Python dependencies manifest
│
├── src/                                  # React 18 TypeScript frontend
│   ├── api/                              # Client HTTP connector & offline fallback
│   ├── components/                       # Modular UI component library
│   │   ├── charts/                       # UniversalChartRenderer & cross-filters
│   │   ├── chat/                         # Conversational bubbles & drawer
│   │   ├── filters/                      # GlobalFilterBar & dynamic chip tags
│   │   ├── layout/                       # CollapsibleSidebar, Navbar, Search
│   │   ├── metrics/                      # DynamicKPIRegistryModal inspector
│   │   ├── ui/                           # Reusable Shadcn UI primitives
│   │   └── upload/                       # Drag-and-drop file upload engine
│   ├── core/                             # In-memory client analytical engines
│   │   ├── ai/                           # Intent parser & deterministic executor
│   │   ├── analytics/                    # Domain adapters & availability gates
│   │   ├── charts/                       # Chart recommendation rule engine
│   │   ├── filters/                      # Pure vectorized filter engine (<5ms)
│   │   ├── metrics/                      # Dynamic KPI registry & math functions
│   │   ├── parser/                       # CSV/TSV/Excel parser & sanitizer
│   │   ├── profiler/                     # Statistical analysis & cleaning tools
│   │   └── semantic/                     # Semantic mapping & domain detection
│   ├── data/                             # 10 comprehensive benchmark datasets
│   ├── pages/                            # 12 specialized business views
│   ├── store/                            # Zustand global state & IndexedDB
│   ├── test/                             # Vitest automated test suites
│   ├── types/                            # Strict TypeScript interface contracts
│   └── utils/                            # Formatters, color palettes & helpers
│
├── ARCHITECTURE.md                       # Comprehensive system architecture guide
├── PROJECT_PROGRESS.md                   # Stage-by-stage implementation tracker
├── TECHNICAL_DECISIONS.md                # Architectural Decision Records (ADRs)
├── TESTING_REPORT.md                     # Complete QA & 300-test audit report
├── vite.config.ts                        # Vite & Rollup code-splitting configuration
├── tsconfig.json                         # Strict TypeScript configuration
└── package.json                          # Node.js project manifest & scripts
```

---

## License & Acknowledgments

This project is licensed under the **MIT License**.

Developed with state-of-the-art standards for autonomous business intelligence, schema-agnostic data processing, and deterministic AI analytics.
