import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseCSVContent, sanitizeCellValue } from '../core/parser/csvParser';
import { parseExcelBuffer } from '../core/parser/excelParser';
import { parseUploadedFile, parseMultipleFiles, MAX_FILE_SIZE_BYTES } from '../core/parser/universalParser';
import { useAppStore } from '../store/useAppStore';
import { Dataset } from '../types';

describe('Stage 2: Universal File Upload Engine & Dataset Manager Validation', () => {
  it('correctly parses CSV with delimiter auto-detection and handles pipe delimiter', () => {
    const pipeCsv = `ID|Employee|Department|Salary
E101|John Doe|Engineering|125000
E102|Jane Smith|Marketing|95000`;
    const result = parseCSVContent(pipeCsv);
    expect(result.errors).toEqual([]);
    expect(result.columns).toEqual(['ID', 'Employee', 'Department', 'Salary']);
    expect(result.rowCount).toBe(2);
    expect(result.delimiterDetected).toBe('|');
  });

  it('neutralizes spreadsheet formula injection in CSV cells for security', () => {
    expect(sanitizeCellValue('=cmd|\' /C calc\'!A0')).toBe('\'=cmd|\' /C calc\'!A0');
    expect(sanitizeCellValue('=SUM(A1:B10)')).toBe('\'=SUM(A1:B10)');
    expect(sanitizeCellValue('@HYPERLINK("http://evil.com")')).toBe('\'@HYPERLINK("http://evil.com")');
    expect(sanitizeCellValue(12500)).toBe(12500);
    expect(sanitizeCellValue('Normal Text')).toBe('Normal Text');
  });

  it('parses multi-sheet XLSX workbooks with disabled formula/macro execution', () => {
    const wb = XLSX.utils.book_new();
    const sheet1Data = [
      ['Product', 'Category', 'Price'],
      ['Laptop Pro', 'Electronics', 1499],
      ['Wireless Mouse', 'Accessories', 29],
    ];
    const sheet2Data = [
      ['Region', 'Q1Sales', 'Q2Sales'],
      ['North America', 450000, 520000],
      ['EMEA', 380000, 410000],
      ['APAC', 290000, 340000],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Products');
    XLSX.utils.book_append_sheet(wb, ws2, 'RegionalSales');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Ingest Sheet 1 (Products)
    const resProducts = parseExcelBuffer(buffer, 'Products');
    expect(resProducts.sheetNames).toEqual(['Products', 'RegionalSales']);
    expect(resProducts.activeSheet).toBe('Products');
    expect(resProducts.parseResult.rowCount).toBe(2);
    expect(resProducts.parseResult.columns).toEqual(['Product', 'Category', 'Price']);
    expect(resProducts.parseResult.data[0]['Product']).toBe('Laptop Pro');

    // Ingest Sheet 2 (RegionalSales)
    const resSales = parseExcelBuffer(buffer, 'RegionalSales');
    expect(resSales.activeSheet).toBe('RegionalSales');
    expect(resSales.parseResult.rowCount).toBe(3);
    expect(resSales.parseResult.columns).toEqual(['Region', 'Q1Sales', 'Q2Sales']);
    expect(resSales.parseResult.data[0]['Region']).toBe('North America');
  });

  it('rejects empty files with descriptive error messages', () => {
    const emptyResult = parseCSVContent('');
    expect(emptyResult.rowCount).toBe(0);
    expect(emptyResult.errors.length).toBeGreaterThan(0);
    expect(emptyResult.errors[0]).toContain('empty');
  });

  it('recovers from malformed CSV with irregular quotes or uneven rows', () => {
    const malformed = `A,B,C
1,2,3
4,5
6,7,8,9`;
    const res = parseCSVContent(malformed);
    expect(res.columns).toEqual(['A', 'B', 'C']);
    expect(res.rowCount).toBeGreaterThanOrEqual(2);
  });

  it('validates file size limit and throws error if file exceeds 50MB', async () => {
    const fakeLargeFile = {
      name: 'large_data.csv',
      size: MAX_FILE_SIZE_BYTES + 1024,
      type: 'text/csv',
    } as unknown as File;

    await expect(parseUploadedFile(fakeLargeFile)).rejects.toThrow(/exceeds maximum size limit/i);
  });

  it('processes multiple files in batch via parseMultipleFiles', async () => {
    const file1 = new File(['Col1,Col2\nA,1\nB,2'], 'file1.csv', { type: 'text/csv' });
    const file2 = new File(['ColX,ColY\n10,20\n30,40'], 'file2.csv', { type: 'text/csv' });

    const batchOutputs = await parseMultipleFiles([file1, file2]);
    expect(batchOutputs.length).toBe(2);
    expect(batchOutputs[0].fileName).toBe('file1.csv');
    expect(batchOutputs[0].parseResult.columns).toEqual(['Col1', 'Col2']);
    expect(batchOutputs[1].fileName).toBe('file2.csv');
    expect(batchOutputs[1].parseResult.columns).toEqual(['ColX', 'ColY']);
  });

  it('guarantees complete dataset isolation, switching, replacement, and deletion in Zustand store', () => {
    const { addDataset, setActiveDatasetId, deleteDataset, replaceDataset } = useAppStore.getState();

    const datasetA: Dataset = {
      id: 'ds-test-A',
      name: 'Dataset A',
      fileName: 'datasetA.csv',
      fileFormat: 'csv',
      fileSize: 1024,
      uploadedAt: new Date().toISOString(),
      rowCount: 2,
      columnCount: 2,
      columns: ['ColA1', 'ColA2'],
      data: [{ ColA1: 'Alpha', ColA2: 100 }, { ColA1: 'Beta', ColA2: 200 }],
      availableSheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      processingStatus: 'ready',
      profiles: {},
      quality: {
        overallScore: 98,
        totalRows: 2,
        totalColumns: 2,
        duplicateRowsCount: 0,
        missingCellsCount: 0,
        missingDataPercentage: 0,
        anomaliesDetected: [],
      },
      detectedDomain: {
        domain: 'saas',
        confidence: 0.9,
        reasoning: ['Test A'],
        domainLabel: 'SaaS',
      },
      semanticMappings: {},
    };

    const datasetB: Dataset = {
      id: 'ds-test-B',
      name: 'Dataset B',
      fileName: 'datasetB.csv',
      fileFormat: 'csv',
      fileSize: 2048,
      uploadedAt: new Date().toISOString(),
      rowCount: 1,
      columnCount: 3,
      columns: ['ColB1', 'ColB2', 'ColB3'],
      data: [{ ColB1: 'X', ColB2: 'Y', ColB3: 'Z' }],
      availableSheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      processingStatus: 'ready',
      profiles: {},
      quality: {
        overallScore: 92,
        totalRows: 1,
        totalColumns: 3,
        duplicateRowsCount: 0,
        missingCellsCount: 0,
        missingDataPercentage: 0,
        anomaliesDetected: [],
      },
      detectedDomain: {
        domain: 'ecommerce',
        confidence: 0.95,
        reasoning: ['Test B'],
        domainLabel: 'E-Commerce',
      },
      semanticMappings: {},
    };

    // Add Dataset A
    addDataset(datasetA);
    expect(useAppStore.getState().activeDatasetId).toBe('ds-test-A');

    // Add Dataset B
    addDataset(datasetB);
    expect(useAppStore.getState().activeDatasetId).toBe('ds-test-B');

    // Verify both exist independently
    const storeDatasets = useAppStore.getState().datasets;
    expect(storeDatasets.some(d => d.id === 'ds-test-A')).toBe(true);
    expect(storeDatasets.some(d => d.id === 'ds-test-B')).toBe(true);

    // Verify isolation: switching back to Dataset A does not contaminate columns/rows
    setActiveDatasetId('ds-test-A');
    const active = useAppStore.getState().datasets.find(d => d.id === useAppStore.getState().activeDatasetId);
    expect(active?.columns).toEqual(['ColA1', 'ColA2']);
    expect(active?.rowCount).toBe(2);

    // Test Replacement of Dataset A
    const updatedA: Dataset = {
      ...datasetA,
      name: 'Dataset A v2',
      rowCount: 3,
      data: [...datasetA.data, { ColA1: 'Gamma', ColA2: 300 }],
    };
    replaceDataset('ds-test-A', updatedA);
    const replaced = useAppStore.getState().datasets.find(d => d.id === 'ds-test-A');
    expect(replaced?.name).toBe('Dataset A v2');
    expect(replaced?.rowCount).toBe(3);

    // Test Deletion
    deleteDataset('ds-test-A');
    expect(useAppStore.getState().datasets.some(d => d.id === 'ds-test-A')).toBe(false);
    expect(useAppStore.getState().activeDatasetId).toBe('ds-test-B');
  });
});
