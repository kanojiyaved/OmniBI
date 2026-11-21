# System Architecture: Universal AI-Powered Dynamic Business Intelligence Platform

## 1. High-Level Full-Stack Architectural Vision
The Universal AI-Powered Dynamic Business Intelligence Platform is an enterprise full-stack system designed for autonomous business intelligence, real-time data ingestion, statistical profiling, semantic domain detection, dynamic KPI calculations, high-performance visual dashboards, and conversational AI data exploration.

```
+---------------------------------------------------------------------------------------------------+
|                                     FRONTEND LAYER (React 18 + TS)                                |
|  - UI / UX System: Tailwind CSS, Shadcn UI, Framer Motion, Lucide React                           |
|  - Dashboard Pages: Executive Dashboard, Data Profiler, Raw Data Vault, AI Insights              |
|  - Visualization Engines: Recharts (Declarative SVG) + Apache ECharts (High-Density Canvas)       |
|  - State Management: Zustand (Dataset Registry, Global Filters, Metrics, AI Chat)                |
|  - Routing: React Router DOM                                                                      |
+---------------------------------------------------------------------------------------------------+
                                                 |
                       REST API / WebSocket Integration (/api/v1)
                                                 |
+---------------------------------------------------------------------------------------------------+
|                                  BACKEND ENGINE (Python 3.11 + FastAPI)                           |
|  - API Routing: Health Telemetry, Dataset Registry, Statistical Analytics, Semantic Mapping       |
|  - Computational Core: Pandas DataFrames & NumPy Vectorized Operations                            |
|  - Architecture: High-concurrency ASGI (Uvicorn), Pydantic v2 Settings & Models                   |
|  - Quality Assurance: Pytest test suite with async HTTP transport                                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Directory Structure & Modular Separation
```
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── health.py         # System health & telemetry endpoints
│   │       ├── dataset.py        # Dataset ingestion & metadata routes
│   │       ├── analytics.py      # Statistical aggregation endpoints
│   │       └── semantic.py       # Domain ontology & semantic mappings
│   ├── core/
│   │   └── config.py             # Pydantic v2 application settings & CORS
│   ├── tests/
│   │   ├── run_tests.py          # Unified test runner
│   │   └── test_backend_health.py# Pytest test suite
│   ├── requirements.txt          # Python dependencies (FastAPI, Pandas, NumPy, etc.)
│   ├── .env.example              # Backend environment template
│   └── main.py                   # FastAPI application entrypoint
├── src/
│   ├── api/
│   │   ├── client.ts             # Fetch API client connecting to FastAPI
│   │   └── healthService.ts      # Health telemetry probe & offline fallback
│   ├── components/
│   │   ├── ui/                   # Reusable Shadcn-style components (Button, Badge, Card, Modal, etc.)
│   │   ├── layout/               # TopNavbar, CollapsibleSidebar, GlobalSearchModal
│   │   ├── filters/              # GlobalFilterBar (Search, Date Horizons, Categories, Ranges, Chips)
│   │   ├── charts/               # UniversalChartRenderer with cross-filtering
│   │   ├── chat/                 # ChatMessageBubble, ChatChartRenderer, AiChatDrawer
│   │   ├── metrics/              # DynamicKPIRegistryModal
│   │   └── upload/               # Universal CSV & Excel upload modal
│   ├── pages/                    # 12 Specialized SaaS analytical page modules
│   ├── core/
│   │   ├── parser/               # Universal parser (CSV, TSV, XLSX, XLS)
│   │   ├── profiler/             # Statistical analysis & anomaly detection
│   │   ├── semantic/             # Business domain classification & column roles
│   │   ├── metrics/              # Dynamic KPI registry & arithmetic engine
│   │   ├── charts/               # Chart recommendation engine & data processor
│   │   ├── analytics/            # Module adapters, availability gates, insights, leaderboard
│   │   ├── ai/                   # Conversational intent parser, deterministic query executor
│   │   └── filters/              # Pure filtering engine (applyGlobalFilters, getFilteredDataset)
│   ├── store/
│   │   └── useAppStore.ts        # Zustand global reactive state
│   ├── types/
│   │   └── index.ts              # Strict TypeScript domain types
│   ├── utils/
│   │   ├── formatters.ts         # Numeric, currency, and date formatters
│   │   └── colors.ts             # Visual design color palettes
│   └── test/
│       ├── setup.ts              # Testing Library & Vitest setup
│       ├── stage0-init.test.ts   # Store & formatting tests
│       ├── stage0-api-client.test.ts # API communication tests
│       ├── stage1-design-system.test.tsx # UI component tests
│       └── stage2-parser.test.ts # CSV & Excel ingestion tests
├── PROJECT_PROGRESS.md           # Stage progression tracker
├── TECHNICAL_DECISIONS.md        # Architectural Decision Records (ADRs)
├── TESTING_REPORT.md             # Quality assurance and verification log
├── .env.example                  # Full-stack environment variable template
├── vite.config.ts                # Vite build & test configuration
├── tsconfig.json                 # Strict TypeScript configuration
└── package.json                  # Node.js project manifest & scripts
```

---

## 3. Technology Stack Specification
| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript (Strict Mode), Vite 5 |
| **Styling & Animation**| Tailwind CSS, Tailwind Animate, Framer Motion |
| **Component System**   | Shadcn UI design patterns, Radix UI primitives, Lucide React icons |
| **Charting Engine**    | Recharts (SVG declarative) & Apache ECharts (Canvas high-throughput) |
| **State Management**   | Zustand v5 |
| **Routing**            | React Router DOM v6 |
| **Backend Framework**  | Python 3.11, FastAPI, Uvicorn (ASGI) |
| **Data Processing**    | Pandas 2.2, NumPy 1.26 |
| **Validation**         | Pydantic v2 (Pydantic-Settings) |
| **Testing**            | Vitest, React Testing Library, Pytest, Playwright |

---

## 4. Architectural Invariants
1. **Zero Dataset Hardcoding**: The application dynamically handles arbitrary column topologies without dataset-specific assumptions.
2. **Hybrid Client-Server Resilience**: The frontend functions 100% offline via client-side Web Workers/TS parsers, seamlessly accelerating with FastAPI + Pandas when the backend is active.
3. **Strict Type Safety**: Pure TypeScript without unchecked `any` across data pipelines.
4. **Deterministic Statistical Quality**: Missing values, outliers, skewness, and cardinality are rigorously calculated using deterministic mathematical algorithms.
5. **Zero Hallucination AI Guarantee**: Natural language queries map to deterministic mathematical execution; calculations are strictly computed on raw tabular records with transparent Pandas and SQL generation.

---

## 5. AI Data Analyst & Conversational Query Architecture

```
[ Natural Language Query: "Top 5 customers by revenue" ]
                     │
                     ▼
       ┌─────────────────────────────┐
       │     Query Intent Parser     │
       │   (`queryIntentParser.ts`)  │
       └──────────────┬──────────────┘
                      │ Intent: RANKING, Entity: Customer, Metric: Revenue, Limit: 5
                      ▼
       ┌─────────────────────────────┐
       │ Deterministic Query Engine  │
       │    (`queryExecutor.ts`)     │
       └──────────────┬──────────────┘
                      │ Computes exact mathematical sums, sorts, and limits
                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                  Rich Conversational Payload                │
       │ • Textual Evidence Summary                                  │
       │ • Highlighted KPI Badges (`metricsHighlighted`)             │
       │ • Recharts Chart Specification (`ChatChartRenderer.tsx`)    │
       │ • Mini Data Table Preview (`tableData`)                     │
       │ • Transparent Python Pandas Code & SQL Equivalent           │
       │ • 3 Contextual Follow-Up Suggestions (`nextQuestions`)       │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     Global Copilot Drawer    │              │ Full Analytics Studio Page   │
│     (`AiChatDrawer.tsx`)     │              │    (`AiAnalystPage.tsx`)     │
└──────────────────────────────┘              └──────────────────────────────┘
```

---

## 6. Data Storage, Export & Enterprise Security Architecture

```
                       ┌──────────────────────────────┐
                       │   Raw / Filtered Datasets    │
                       └──────────────┬───────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│     Client Persistence    │                   │   Security & Sanitization │
│  (`indexedDbStorage.ts`)  │                   │  (`securitySanitizer.ts`) │
├───────────────────────────┤                   ├───────────────────────────┤
│ • High-Capacity IndexedDB │                   │ • CWE-1236 Formula Escape │
│ • 50MB+ Large Data Cache  │                   │ • PII Masking (Email, CC, │
│ • Multi-Store Partitioning│                   │   Phone)                  │
│ • AES-GCM Encrypted Cache │                   │ • XSS Entity Sanitization │
└───────────────────────────┘                   └─────────────┬─────────────┘
                                                              │
                                       ┌──────────────────────┴──────────────────────┐
                                       ▼                                             ▼
                        ┌──────────────────────────────┐              ┌──────────────────────────────┐
                        │   Universal Export Engine    │              │   Backend FastAPI Exporter   │
                        │     (`exportEngine.ts`)      │              │  (`backend/core/exporter.py`)│
                        ├──────────────────────────────┤              ├──────────────────────────────┤
                        │ • Formatted CSV with BOM     │              │ • Streaming CSV (/csv)       │
                        │ • Multi-Sheet XLSX (SheetJS) │              │ • Openpyxl Excel (/excel)    │
                        │ • Structured Metadata JSON   │              │ • JSON Report (/report)      │
                        │ • Executive PDF Report       │              │                              │
                        └──────────────────────────────┘              └──────────────────────────────┘
```

