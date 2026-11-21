# Technical Decisions Log (ADR)

## ADR-001: Vite + React 18 + TypeScript Foundation
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** High computational throughput is required for data parsing, sub-second chart rendering, and strict type safety across statistical pipelines.
- **Decision:** Use Vite with React 18 and strict TypeScript.
- **Consequences:** Near-instant hot module replacement (HMR), tree-shakeable bundles, strict type safety for data structures.

## ADR-002: Dual Visualization Engine (Recharts + Apache ECharts)
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** The platform requires both accessible declarative SVG charts for standard dashboards and high-throughput canvas rendering for 50,000+ data point scatter plots and treemaps.
- **Decision:** Combine Recharts for declarative dashboard components with Apache ECharts for complex high-density visual analytics.
- **Consequences:** Best of both worlds: React-idiomatic JSX components with enterprise-grade GPU/canvas acceleration.

## ADR-003: Python FastAPI + Pandas Analytics Core
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Heavy analytical workloads, domain ontology matching, correlation matrices, and future machine learning forecasting benefit from Python's data science ecosystem.
- **Decision:** Build a FastAPI backend utilizing Pandas 2.2 and NumPy 1.26 with asynchronous ASGI routing.
- **Consequences:** Python data science power coupled with asynchronous non-blocking API performance.

## ADR-004: Zustand State Management with Modular Slices
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Multiple independent modules (Global Filters, Chart Grids, KPI Cards, AI Chat Drawer, Data Profiler) need synchronized access to the active dataset without unnecessary re-renders.
- **Decision:** Use Zustand with modular slices and shallow selectors.
- **Consequences:** Minimal boilerplate, no Context API re-render cascades, direct subscriber hooks.

## ADR-005: Dual-Tier CSV/XLSX Processing Architecture
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** User datasets vary from small 100-row sheets to 50,000+ row business exports in CSV, TSV, XLSX, or XLS formats.
- **Decision:** Utilize PapaParse for CSV streaming with auto-delimiter detection and SheetJS (xlsx) for multi-sheet workbook extraction.
- **Consequences:** Universal support for all major spreadsheet formats with zero server dependency.

## ADR-006: Hybrid Client/Server Fault-Tolerant Architecture
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Users may run the dashboard locally in browser-only mode or connected to a dedicated FastAPI backend container.
- **Decision:** The frontend is fully autonomous and functions offline; when the FastAPI backend is online, the frontend communicates seamlessly to offload server-side batch profiling and ML jobs.
- **Consequences:** Zero downtime, graceful degradation, maximum portability.

## ADR-007: Non-Destructive Data Cleaning with Full Audit Trail and Undo Stack
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Business users need to clean messy datasets (drop duplicates, impute nulls, standardize casing, cast datatypes) while ensuring raw business data is never irretrievably mutated.
- **Decision:** Maintain immutable `rawRows` upon upload, apply cleaning operations immutably into `data`, and store a chronological `cleaningHistory` stack capturing previous state snapshots.
- **Consequences:** Provides guaranteed recoverability (`undoCleaningAction`, `resetDatasetToRaw`), full auditability, and immediate statistical re-profiling upon every transformation.

## ADR-008: Multi-Factor Weighted Domain Ontology & Semantic Role Mapping
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Business intelligence dashboards need to dynamically identify primary KPIs, dates, dimensions, categories, and entities across diverse business domains without hardcoding schemas.
- **Decision:** Implement a multi-factor weighted domain ontology across 8 major domains (Sales, Marketing, Finance, E-commerce, Customer Analytics, HR, Inventory, Operations, SaaS, General). Weighted indicators (+3.0 primary metrics, +1.5 secondary metrics, +1.5 dimensions, +1.2 entities, +1.0 indicators) generate confidence scores and human-readable reasoning trails, while allowing users to override any domain or column role directly from the UI.
- **Consequences:** Zero hardcoded metric formulas, complete adaptability to any tabular dataset, transparent AI reasoning.

## ADR-009: Dynamic Semantic KPI Calculation Engine with Sparklines and Trend Direction
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Business users need executive summary indicators immediately upon uploading any arbitrary dataset without manual metric configuration.
- **Decision:** Automatically compute dynamic aggregations (SUM, AVG, COUNT, UNIQUE_COUNT, MIN, MAX) mapped to detected primary/secondary metrics and entity keys. Generate period-over-period growth rates with 7-point sparklines from dates and values.
- **Consequences:** Instant executive summaries for any tabular business dataset.

## ADR-010: AI Dataset Understanding Report & Interactive Semantic Mapping UI
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Business users require clarity on how OmniBI interprets unfamiliar column names, which analytics modules are supported, and which columns require human governance before downstream aggregation.
- **Decision:** Provide an interactive semantic mapping screen (`Original Column | Suggested Meaning | Confidence | User Action`) coupled with a deterministic AI Dataset Understanding Report detailing dataset representation, derivable metrics, available/unavailable modules with reasons, and confirmation lists for confidence < 0.70.
- **Consequences:** Eliminates AI hallucination; ensures mathematical determinism and user agency over data semantics.

## ADR-011: Rule-Based Chart Recommendation Engine & Dynamic Multi-Section Dashboard
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Business dashboards require automatic visual generation that matches the statistical distribution and semantic types of uploaded data without manual report builder drag-and-drop.
- **Decision:** Implement deterministic chart recommendation rules (Date + Metric -> Line/Area, Category + Metric -> Bar, Status + Count -> Donut, Numeric + Numeric -> Scatter, Multi-Metric over Date -> Multi-Line), coupled with user toggles to manually swap chart types. The OverviewPage synthesizes 8 dynamic sections (KPIs, Trend, Trajectory, Category Breakdown, Recent Records, Leaderboard Top Performers, Automated Insights, and Quality Summary) that dynamically recalculate upon dataset switching without stale artifacts.
- **Consequences:** Instant executive visual synthesis across any business domain with complete chart customizability and zero stale metric leakage.

## ADR-012: Specialized Module Adapters with Universal Domain Adaptation Layer
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Specialized enterprise BI modules (Deal Management, Sales Pipeline Kanban, Campaign Analytics, Financial Statements, Stakeholders Directory, Goals Attainment) need to consume active dataset records without crashing or displaying blank screens when the uploaded dataset belongs to an unrelated business domain.
- **Decision:** Implement specialized module adapters (`moduleAdapters.ts`) that dynamically inspect semantic roles and column topologies to extract domain entities, pipeline stages, marketing metrics, and categorical breakdowns. When a dataset belongs to a different domain, the `DomainAdaptationBanner` informs users of the adapted projection, while fallback demo data is displayed with an explicit "Synthetic Preview Mode" indicator when no dataset is loaded.
- **Consequences:** Seamless cross-domain resilience, zero application crashes, and immediate business utility across arbitrary tabular schemas.

## ADR-013: Module Availability Gating & Strict Non-Fabrication Rule
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Enterprise BI platforms must uphold data integrity by refusing to hallucinate or fabricate specialized business records (such as fake CRM opportunities or ad clicks) when an active dataset contains unrelated schema topologies (e.g. Weather, Server Logs, or Payroll).
- **Decision:** Implement deterministic module availability detectors (`moduleAvailability.ts`) that verify the presence of mandatory schema attributes for each module (e.g. deal entities + value metrics for Deal Management; campaign dimensions + performance metrics for Campaign Management; status fields for Sales Pipeline; customer identifiers for Contact Management; date fields for Calendar). When mandatory requirements are not met, the system strictly renders `ModuleUnavailableState`, displaying missing fields and available columns without data fabrication.
- **Consequences:** Absolute data trustworthiness, enterprise compliance, and clear UX feedback for multi-domain dataset switching.

## ADR-014: Deterministic Zero-Hallucination Conversational Analytics Engine
- **Context:** Large language models frequently hallucinate numerical metrics, statistics, and aggregations when asked numerical queries about tabular datasets. Enterprise Business Intelligence requires 100% mathematical precision and reproducibility.
- **Decision:** Split the conversational data query pipeline into two distinct layers:
  1. *Semantic Intent & Entity Parsing*: Maps natural language tokens to structured query intents (`SUMMARY`, `AGGREGATION`, `BREAKDOWN`, `RANKING`, `CORRELATION`, `FILTER`) and resolves column names and semantic roles with linguistic stemming.
  2. *Deterministic Query Execution*: Computes pure arithmetic operations (sums, means, grouped aggregations, Pearson $r$) directly on actual tabular records. Generates inspectable code snippets (Pandas and SQL) alongside the answer so users can audit the exact computation.
- **Consequences:** Eliminates AI arithmetic hallucination entirely, ensures reproducible figures matching backend calculations, and provides code transparency for citizen data scientists.

## ADR-015: Dual Conversational Surfaces (Global Copilot Drawer & Full-Screen Conversational Studio)
- **Context:** Users require both quick contextual querying while browsing existing dashboards and an immersive, dedicated workspace for in-depth data exploration and multi-turn conversations.
- **Decision:** Implement a dual-surface architecture sharing a unified Zustand store:
  1. *`AiChatDrawer.tsx`*: A slide-out global drawer accessible from any page via the top navigation bar or quick triggers, allowing non-disruptive analytical questions.
  2. *`AiAnalystPage.tsx`*: A full-featured analytical studio with active schema telemetry, categorized prompt catalogs, embedded Recharts visualizations, mini-tables, and transcript export (Markdown / JSON).
- **Consequences:** Seamless workflow flexibility, zero duplicate state, and synchronized conversational history across all application views.

## ADR-016: Unified Pure Filtering Engine & getFilteredDataset Pattern
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Enterprise BI dashboards require global filtering across multiple dimensions (free-text search, date horizons, categorical checkboxes, numeric intervals, and cross-filters) that dynamically updates every dashboard card, KPI, chart, and specialized module without duplicating downstream calculation code.
- **Decision:** Implement `applyGlobalFilters` and `getFilteredDataset` in `filterEngine.ts`. `getFilteredDataset` creates a shallow clone of the active dataset whose `data` and `rowCount` are filtered in pure TypeScript (sub-5ms execution for up to 50,000 records). All downstream pages (`OverviewPage`, `DealManagementPage`, `SalesPipelinePage`, `CampaignManagementPage`, `ReportsPage`, `ContactsPage`, `GoalsPage`, `DataExplorerPage`) simply consume the filtered dataset without requiring custom filter logic in each view.
- **Consequences:** Guaranteed cross-module consistency, zero duplicate filtering logic, instant 60fps reactivity, and seamless preservation of dataset structure for metric recalculation.

## ADR-017: Multi-Modal Cross-Component Click-to-Filter on Universal Chart Elements
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Power users expect modern BI platforms to support interactive click-to-filter (brushing and linking): clicking a categorical bar (e.g. "Europe" or "Proposal") should immediately isolate that segment across all other visual cards and tables.
- **Decision:** Enhance `UniversalChartRenderer.tsx` with `activeCrossFilter` and `onCrossFilter` props across Bar, Horizontal Bar, Pie/Donut, and Scatter charts. When an element is clicked, it sets `activeCrossFilter = { column, value }`; clicking the same element again toggles it off. Visual dimming (`opacity: 0.35`) is applied to inactive slices/bars while the selected segment remains highlighted (`opacity: 1.0` with stroke outline). A prominent removable badge appears in the `GlobalFilterBar`.
- **Consequences:** Intuitive exploratory slicing, visual clarity through contrast dimming, and bidirectional sync with the global filter state.

## ADR-018: High-Capacity IndexedDB Client-Side Persistence with Graceful In-Memory Fallback
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Large enterprise datasets (50MB+, 100,000+ rows) easily exceed browser `localStorage`'s strict 5MB quota, causing uncaught `QuotaExceededError` exceptions. Users also need seamless persistence across browser refreshes for datasets, metadata, and custom goals.
- **Decision:** Build a dedicated IndexedDB storage engine (`indexedDbStorage.ts`) with multi-store partitioning: `datasets`, `metadata`, and `app_settings`. Wrap the native asynchronous IDB API without heavy external dependencies. Implement a transparent in-memory fallback layer for environments where IndexedDB is blocked or disabled (private browsing mode, test suites, or SSR). Provide live quota telemetry (`getStorageQuota`) and one-click cache purge actions in `SettingsPage.tsx`.
- **Consequences:** High-capacity local caching supporting 50MB+ datasets, sub-10ms async lookups, zero quota crash exceptions, and robust testability in headless environments.

## ADR-019: Spreadsheet Formula Injection Neutralization (CWE-1236) and PII Data Masking
- **Date:** 2026-11-21
- **Status:** APPROVED
- **Context:** Exporting raw datasets to CSV or Excel (.xlsx) creates high-severity vulnerability CWE-1236 (CSV / Formula Injection): cell values starting with `=cmd|...`, `+`, `-`, `@`, `\t`, or `%` can execute arbitrary shell commands or DDE calls when opened in Microsoft Excel or LibreOffice Calc. Furthermore, compliance (GDPR/HIPAA) requires masking sensitive PII (emails, phone numbers, payment cards) upon export.
- **Decision:** Implement a centralized security and sanitization engine (`securitySanitizer.ts`) and corresponding Python backend exporter (`backend/core/exporter.py`):
  1. *Formula Injection Neutralizer:* Prepends a single quote (`'`) to any string starting with `=`, `+`, `-`, `@`, `\t`, `\r`, or `%`, forcing spreadsheet processors to treat the cell strictly as text literals.
  2. *Sensitive PII Masking:* Implements deterministic masking functions for email addresses (`j***e@domain.com`), phone numbers (`***-***-5678`), and payment cards (`****-****-****-9010`), toggled via user export preferences.
  3. *Multi-Sheet Styled Excel (.xlsx):* Uses SheetJS / Openpyxl to deliver 3 partitioned sheets: "Records", "Executive KPIs", and "Data Profiling".
- **Consequences:** Complete enterprise immunity against formula injection attacks, automated PII compliance, and rich multi-format export capabilities.
