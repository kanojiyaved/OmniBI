import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAppStore } from '../store/useAppStore';
import {
  isFormulaInjectionThreat,
  sanitizeFormulaInjection,
  maskEmail,
  maskPhone,
  maskCreditCard,
  detectAndMaskValue,
  sanitizeRecordForExport,
  sanitizeDataMatrix,
  sanitizeText,
  encryptPayload,
  decryptPayload,
} from '../core/security/securitySanitizer';
import {
  saveDatasetToStorage,
  loadDatasetFromStorage,
  listStoredDatasets,
  deleteDatasetFromStorage,
  clearAllStorage,
  getStorageQuota,
} from '../core/storage/indexedDbStorage';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
  exportChartAsPNG,
  sanitizeFilename,
} from '../core/export/exportEngine';
import { parseUploadedFile } from '../core/parser/universalParser';
import {
  DEFAULT_USERS,
  hasPermission,
  canUserPerform,
  assertPermission,
  filterDatasetsForUser,
  createDatasetHistoryRecord,
} from '../core/security/authManager';
import { ExportModal } from '../components/export/ExportModal';
import { SettingsPage } from '../pages/SettingsPage';
import { Dataset, KPIDefinition, UserProfile } from '../types';

const MOCK_DATASET: Dataset = {
  id: 'ds-stage10-test',
  name: 'Security & Enterprise Telemetry',
  fileSize: 8192,
  rowCount: 3,
  columnCount: 5,
  columns: ['id', 'user_name', 'email', 'phone', 'revenue'],
  rawRows: [],
  data: [
    { id: 'REC-1', user_name: '=cmd|/C calc', email: 'alice.vanderbilt@enterprise.com', phone: '+1 (555) 345-6789', revenue: 15000 },
    { id: 'REC-2', user_name: '+SUM(A1:A10)', email: 'bob.marley@reggae.org', phone: '+44 20 7946 0958', revenue: 8500 },
    { id: 'REC-3', user_name: 'Charlie Safe', email: 'charlie@domain.com', phone: '555-890-1234', revenue: 22000 },
  ],
  profiles: {
    id: { columnName: 'id', inferredType: 'id', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    user_name: { columnName: 'user_name', inferredType: 'text', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    email: { columnName: 'email', inferredType: 'text', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    phone: { columnName: 'phone', inferredType: 'text', nullCount: 0, distinctCount: 3, uniqueCount: 3 },
    revenue: { columnName: 'revenue', inferredType: 'currency', nullCount: 0, distinctCount: 3, uniqueCount: 3, min: 8500, max: 22000, mean: 15166.67 },
  },
  quality: {
    healthScore: 98,
    overallScore: 98,
    missingCellsCount: 0,
    duplicateRowsCount: 0,
    anomaliesDetected: [],
  },
  detectedDomain: {
    domain: 'sales',
    confidence: 0.95,
    domainLabel: 'Enterprise Sales',
    reasoning: [],
  },
  semanticMappings: {
    id: { column: 'id', role: 'entity_id', suggestedMeaning: 'Record ID', confidence: 1, requiresConfirmation: false, confirmed: true },
    revenue: { column: 'revenue', role: 'primary_metric', suggestedMeaning: 'Total Revenue', confidence: 1, requiresConfirmation: false, confirmed: true },
  },
} as unknown as Dataset;

const MOCK_KPIS: KPIDefinition[] = [
  {
    id: 'kpi-rev',
    label: 'Total Revenue',
    description: 'Sum of all revenues',
    category: 'Sales',
    format: 'currency',
    trend: 'up',
    isPositiveGood: true,
    value: 45500,
    aggregation: 'sum',
    columnName: 'revenue',
    formula: 'SUM(revenue)',
  },
];

async function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('Stage 10: Data Storage, Comprehensive Export & Security Layer', () => {
  beforeEach(async () => {
    await clearAllStorage();
    useAppStore.setState({
      datasets: [MOCK_DATASET],
      activeDatasetId: MOCK_DATASET.id,
      kpis: MOCK_KPIS,
      filters: {
        dateRange: { start: null, end: null },
        categoricalFilters: {},
        numericRanges: {},
        activeCrossFilter: null,
        searchQuery: '',
      },
    });
  });

  // ==========================================================================
  // 1. SECURITY & SANITIZATION TESTS
  // ==========================================================================
  describe('1. Security & Sanitization Layer', () => {
    it('detects formula injection triggers accurately (CWE-1236)', () => {
      expect(isFormulaInjectionThreat('=1+2')).toBe(true);
      expect(isFormulaInjectionThreat('+12345')).toBe(true);
      expect(isFormulaInjectionThreat('-5+cmd')).toBe(true);
      expect(isFormulaInjectionThreat('@SUM(A1:B2)')).toBe(true);
      expect(isFormulaInjectionThreat('\tATTACK')).toBe(true);
      expect(isFormulaInjectionThreat('%0Acalc')).toBe(true);
      expect(isFormulaInjectionThreat('   =spacedFormula')).toBe(true);

      // Safe values
      expect(isFormulaInjectionThreat('Ordinary String')).toBe(false);
      expect(isFormulaInjectionThreat(100)).toBe(false);
      expect(isFormulaInjectionThreat(null)).toBe(false);
    });

    it('neutralizes formula injection by prepending single quote', () => {
      expect(sanitizeFormulaInjection('=cmd|/C calc')).toBe("'=cmd|/C calc");
      expect(sanitizeFormulaInjection('+SUM(A1:A10)')).toBe("'+SUM(A1:A10)");
      expect(sanitizeFormulaInjection('@DDE_EXEC')).toBe("'@DDE_EXEC");
      expect(sanitizeFormulaInjection('Safe Product')).toBe('Safe Product');
      expect(sanitizeFormulaInjection(5000)).toBe(5000);
    });

    it('masks email addresses preserving first and last characters and domain', () => {
      const masked = maskEmail('alexander.smith@company.com');
      expect(masked.startsWith('a')).toBe(true);
      expect(masked.endsWith('@company.com')).toBe(true);
      expect(masked).toContain('*');
      expect(masked).not.toContain('smith');

      // Short emails
      expect(maskEmail('ab@test.com')).toBe('a*@test.com');
    });

    it('masks phone numbers preserving only last 4 digits', () => {
      expect(maskPhone('+1 (555) 234-5678')).toBe('***-***-5678');
      expect(maskPhone('415-890-1234')).toBe('***-***-1234');
    });

    it('masks credit card numbers preserving only last 4 digits', () => {
      expect(maskCreditCard('4532-1234-5678-9010')).toBe('****-****-****-9010');
      expect(maskCreditCard('5500 0000 0000 4321')).toBe('****-****-****-4321');
    });

    it('sanitizes complete data matrices with vectorized formula and PII rules', () => {
      const sanitized = sanitizeDataMatrix(MOCK_DATASET.data, {
        preventFormulaInjection: true,
        maskPII: true,
      });

      expect(sanitized).toHaveLength(3);
      // Formula neutralized
      expect(sanitized[0].user_name).toBe("'=cmd|/C calc");
      expect(sanitized[1].user_name).toBe("'+SUM(A1:A10)");
      // PII masked
      expect(sanitized[0].email).toContain('@enterprise.com');
      expect(sanitized[0].email).toContain('*');
      expect(sanitized[0].phone).toBe('***-***-6789');
    });

    it('sanitizes unsafe text inputs to prevent XSS injection', () => {
      const xssInput = '<script>alert("pwned")</script>&"\'';
      const safe = sanitizeText(xssInput);
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script&gt;');
      expect(safe).toContain('&amp;');
      expect(safe).toContain('&quot;');
    });

    it('encrypts and decrypts storage payloads with cryptographic reversibility', async () => {
      const plainPayload = JSON.stringify({ secretApiKey: 'sk_live_enterprise_998877' });
      const encrypted = await encryptPayload(plainPayload);
      expect(encrypted).not.toBe(plainPayload);

      const decrypted = await decryptPayload(encrypted);
      expect(decrypted).toBe(plainPayload);
      expect(JSON.parse(decrypted).secretApiKey).toBe('sk_live_enterprise_998877');
    });
  });

  // ==========================================================================
  // 2. CLIENT PERSISTENCE & STORAGE TESTS
  // ==========================================================================
  describe('2. Client-Side Persistence & Storage Engine', () => {
    it('persists, lists, loads, and deletes datasets in storage', async () => {
      // 1. Save dataset
      const saved = await saveDatasetToStorage(MOCK_DATASET);
      expect(saved).toBe(true);

      // 2. List stored datasets
      const list = await listStoredDatasets();
      expect(list.length).toBeGreaterThanOrEqual(1);
      const entry = list.find((d) => d.datasetId === MOCK_DATASET.id);
      expect(entry).toBeDefined();
      expect(entry?.datasetName).toBe(MOCK_DATASET.name);
      expect(entry?.byteSize).toBeGreaterThan(0);

      // 3. Load dataset
      const loaded = await loadDatasetFromStorage(MOCK_DATASET.id);
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(MOCK_DATASET.id);
      expect(loaded?.data).toHaveLength(3);

      // 4. Check quota telemetry
      const quota = await getStorageQuota();
      expect(quota.persistedCount).toBeGreaterThanOrEqual(1);
      expect(quota.usageBytes).toBeGreaterThan(0);

      // 5. Delete dataset
      const deleted = await deleteDatasetFromStorage(MOCK_DATASET.id);
      expect(deleted).toBe(true);

      // 6. Verify deleted
      const postDeleteList = await listStoredDatasets();
      expect(postDeleteList.find((d) => d.datasetId === MOCK_DATASET.id)).toBeUndefined();
    });

    it('clearAllStorage completely empties all caches and quotas', async () => {
      await saveDatasetToStorage(MOCK_DATASET);
      await clearAllStorage();

      const list = await listStoredDatasets();
      expect(list).toHaveLength(0);

      const quota = await getStorageQuota();
      expect(quota.persistedCount).toBe(0);
      expect(quota.usageBytes).toBe(0);
    });
  });

  // ==========================================================================
  // 3. MULTI-FORMAT EXPORT SUITE TESTS
  // ==========================================================================
  describe('3. Multi-Format Universal Export Engine', () => {
    it('exportToCSV generates delimited text with UTF-8 BOM and formula sanitization', async () => {
      const blob = exportToCSV(MOCK_DATASET.data, MOCK_DATASET.columns, {
        delimiter: ';',
        includeBOM: true,
        preventFormulaInjection: true,
        maskPII: true,
      });

      const blobNoBOM = exportToCSV(MOCK_DATASET.data, MOCK_DATASET.columns, {
        delimiter: ';',
        includeBOM: false,
        preventFormulaInjection: true,
        maskPII: true,
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain('text/csv');
      // BOM adds exactly 3 bytes (0xEF, 0xBB, 0xBF)
      expect(blob.size).toBe(blobNoBOM.size + 3);

      // Convert blob to text
      const text = await readBlobAsText(blob);
      // Uses custom delimiter
      expect(text).toContain(';');
      // Neutralized formula
      expect(text).toContain("'=cmd|/C calc");
      // Masked email
      expect(text).not.toContain('alice.vanderbilt@enterprise.com');
    });

    it('exportToExcel creates a valid multi-sheet workbook (.xlsx)', async () => {
      const blob = exportToExcel(MOCK_DATASET.data, MOCK_KPIS, MOCK_DATASET, {
        preventFormulaInjection: true,
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(100);
    });

    it('exportToJSON generates structured metadata document with quality and KPIs', async () => {
      const blob = exportToJSON(MOCK_DATASET.data, MOCK_DATASET, MOCK_KPIS);
      expect(blob).toBeInstanceOf(Blob);

      const text = await readBlobAsText(blob);
      const parsed = JSON.parse(text);

      expect(parsed.exportMetadata.datasetId).toBe(MOCK_DATASET.id);
      expect(parsed.exportMetadata.totalRecordsExported).toBe(3);
      expect(parsed.executiveKPIs).toHaveLength(1);
      expect(parsed.executiveKPIs[0].name).toBe('Total Revenue');
      expect(parsed.dataQuality.overallHealthScore).toBe(98);
      expect(parsed.records).toHaveLength(3);
    });

    it('exportToPDF generates executive PDF document blob via jsPDF', () => {
      const blob = exportToPDF(MOCK_DATASET.data, MOCK_DATASET, MOCK_KPIS);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(500);
    });

    it('sanitizeFilename generates safe filenames with timestamps', () => {
      const name = sanitizeFilename('Sales & Operations Report!!!', 'xlsx');
      expect(name).toMatch(/^sales_operations_report_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  // ==========================================================================
  // 4. UI COMPONENTS INTEGRATION TESTS
  // ==========================================================================
  describe('4. UI ExportModal & SettingsPage Integration', () => {
    it('ExportModal renders all 4 export formats and triggers file export', async () => {
      const handleClose = vi.fn();
      render(<ExportModal isOpen={true} onClose={handleClose} />);

      // Modal titles and tabs
      expect(screen.getByText('Export Analytics & Dataset')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('PDF Report')).toBeInTheDocument();

      // Check security controls exist
      expect(screen.getByText(/Spreadsheet Formula Sanitization/i)).toBeInTheDocument();
      expect(screen.getByText(/Mask Sensitive PII/i)).toBeInTheDocument();

      // Click Download button
      const downloadBtn = screen.getByRole('button', { name: /Download CSV/i });
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(screen.getByText(/Exported!/i)).toBeInTheDocument();
      });
    });

    it('SettingsPage displays client storage telemetry, cache purge, and security controls', async () => {
      await saveDatasetToStorage(MOCK_DATASET);

      render(<SettingsPage />);

      // Verify sections render
      expect(screen.getByText('Platform Settings')).toBeInTheDocument();
      expect(screen.getByText(/Client Storage & IndexedDB Cache/i)).toBeInTheDocument();
      expect(screen.getByText(/Security & Sanitization Governance/i)).toBeInTheDocument();
      expect(screen.getByText(/Formula Injection Prevention \(CWE-1236\)/i)).toBeInTheDocument();

      // Check purge cache button
      const clearBtn = screen.getByRole('button', { name: /Clear Cache/i });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText(/Storage Cleared/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // 5. RBAC, UPLOAD RESTRICTIONS, PNG EXPORT & PRIVACY CONTROLS
  // ==========================================================================
  describe('5. RBAC, Upload Restrictions, PNG Export & Privacy Controls', () => {
    it('exportChartAsPNG generates a PNG image blob from a DOM element', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<h3>Monthly Revenue Bar Chart</h3><svg width="200" height="100"></svg>';
      document.body.appendChild(container);

      const blob = await exportChartAsPNG(container, 'monthly_revenue_chart');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');

      document.body.removeChild(container);
    });

    it('rejects prohibited executable file extensions (.bat, .exe, .sh) on upload', async () => {
      const maliciousFile = new File(['echo malicious'], 'exploit.bat', { type: 'application/x-bat' });

      await expect(parseUploadedFile(maliciousFile)).rejects.toThrow(
        /Security violation: Executable\/script file type "\.bat" is strictly prohibited/i
      );
    });

    it('enforces RBAC permissions across Admin, Analyst, and Viewer roles', () => {
      const admin = DEFAULT_USERS.find((u) => u.role === 'admin')!;
      const analyst = DEFAULT_USERS.find((u) => u.role === 'analyst')!;
      const viewer = DEFAULT_USERS.find((u) => u.role === 'viewer')!;

      // Admin permissions
      expect(canUserPerform(admin, 'dataset:upload')).toBe(true);
      expect(canUserPerform(admin, 'dataset:delete')).toBe(true);
      expect(canUserPerform(admin, 'storage:purge')).toBe(true);

      // Analyst permissions
      expect(canUserPerform(analyst, 'dataset:upload')).toBe(true);
      expect(canUserPerform(analyst, 'dataset:clean')).toBe(true);
      expect(canUserPerform(analyst, 'dataset:delete')).toBe(false);

      // Viewer permissions
      expect(canUserPerform(viewer, 'dataset:export')).toBe(true);
      expect(canUserPerform(viewer, 'dataset:upload')).toBe(false);
      expect(canUserPerform(viewer, 'dataset:delete')).toBe(false);
      expect(canUserPerform(viewer, 'dataset:clean')).toBe(false);

      // Assert permission throws for unauthorized role
      expect(() => assertPermission(viewer, 'dataset:delete')).toThrow(/Access Denied/i);
    });

    it('store prevents unauthorized dataset deletion when logged in as Viewer', () => {
      const viewer = DEFAULT_USERS.find((u) => u.role === 'viewer')!;
      useAppStore.setState({ currentUser: viewer });

      // Attempt to delete dataset as Viewer
      useAppStore.getState().deleteDataset(MOCK_DATASET.id);

      // Dataset should not be deleted, error should be set
      expect(useAppStore.getState().datasets).toHaveLength(1);
      expect(useAppStore.getState().error).toMatch(/Access Denied/i);
    });

    it('isolates datasets strictly by tenant ID', () => {
      const tenantAUser: UserProfile = { ...DEFAULT_USERS[0], tenantId: 'tenant-alpha' };
      const tenantBUser: UserProfile = { ...DEFAULT_USERS[0], tenantId: 'tenant-beta' };

      const datasetAlpha: Dataset = { ...MOCK_DATASET, id: 'ds-a', tenantId: 'tenant-alpha' };
      const datasetBeta: Dataset = { ...MOCK_DATASET, id: 'ds-b', tenantId: 'tenant-beta' };
      const datasetShared: Dataset = { ...MOCK_DATASET, id: 'ds-shared', tenantId: undefined };

      const allDatasets = [datasetAlpha, datasetBeta, datasetShared];

      const visibleToAlpha = filterDatasetsForUser(allDatasets, tenantAUser);
      expect(visibleToAlpha.map((d) => d.id)).toEqual(['ds-a', 'ds-shared']);

      const visibleToBeta = filterDatasetsForUser(allDatasets, tenantBUser);
      expect(visibleToBeta.map((d) => d.id)).toEqual(['ds-b', 'ds-shared']);
    });

    it('records dataset history audit logs on upload, replacement, deletion, and switching', () => {
      const admin = DEFAULT_USERS.find((u) => u.role === 'admin')!;
      useAppStore.setState({ currentUser: admin, datasetHistory: [] });

      const newDataset: Dataset = {
        ...MOCK_DATASET,
        id: 'ds-audit-test',
        name: 'Audit Ingestion Target',
      };

      // 1. Upload
      useAppStore.getState().addDataset(newDataset);
      let history = useAppStore.getState().datasetHistory;
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('uploaded');

      // 2. Switch
      useAppStore.getState().setActiveDatasetId(newDataset.id);
      history = useAppStore.getState().datasetHistory;
      expect(history[0].action).toBe('switched');

      // 3. Delete
      useAppStore.getState().deleteDataset(newDataset.id);
      history = useAppStore.getState().datasetHistory;
      expect(history[0].action).toBe('deleted');
    });

    it('stores and preserves privacy preferences (local processing and cloud AI consent)', () => {
      useAppStore.getState().setUserPreferences({
        localProcessingOnly: true,
        cloudAiConsent: false,
        dataRetentionPolicy: '7_days',
      });

      const prefs = useAppStore.getState().userPreferences;
      expect(prefs.localProcessingOnly).toBe(true);
      expect(prefs.cloudAiConsent).toBe(false);
      expect(prefs.dataRetentionPolicy).toBe('7_days');
    });
  });
});
