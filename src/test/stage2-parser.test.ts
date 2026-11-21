import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { normalizeHeaders, parseCSVContent } from '../core/parser/csvParser';
import { parseExcelBuffer } from '../core/parser/excelParser';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

describe('Stage 2: Universal CSV & Excel Upload Engine Tests', () => {
  it('normalizes headers: handles whitespace, BOM, empty headers, and deduplicates identical names', () => {
    const rawHeaders = ['\uFEFFRevenue ', '  Customer Segment  ', '', 'Revenue', 'Revenue'];
    const normalized = normalizeHeaders(rawHeaders);
    expect(normalized).toEqual([
      'Revenue',
      'Customer Segment',
      'Column_3',
      'Revenue_2',
      'Revenue_3',
    ]);
  });

  it('correctly parses standard comma-separated CSV with header row', () => {
    const csv = `Product,Price,Quantity
Laptop,1200,5
Mouse,25,50
Keyboard,75,20`;
    const result = parseCSVContent(csv);
    expect(result.errors).toEqual([]);
    expect(result.columns).toEqual(['Product', 'Price', 'Quantity']);
    expect(result.rowCount).toBe(3);
    expect(result.data[0]).toEqual({ Product: 'Laptop', Price: '1200', Quantity: '5' });
  });

  it('correctly parses semicolon-delimited CSV', () => {
    const tsvOrSemicolon = `Country;GDP;Population
USA;25000000;330000000
Germany;4200000;84000000`;
    const result = parseCSVContent(tsvOrSemicolon);
    expect(result.columns).toEqual(['Country', 'GDP', 'Population']);
    expect(result.rowCount).toBe(2);
    expect(result.delimiterDetected).toBe(';');
  });

  it('handles empty or blank CSV inputs gracefully without crashing', () => {
    const result = parseCSVContent('   ');
    expect(result.rowCount).toBe(0);
    expect(result.columns).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('creates and parses multi-sheet Excel workbooks using SheetJS', () => {
    // Generate an in-memory workbook with 2 sheets
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Department', 'Headcount', 'Budget'],
      ['Engineering', 45, 1200000],
      ['Sales', 30, 950000],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['ProjectName', 'Status', 'RiskLevel'],
      ['Alpha', 'Active', 'Low'],
      ['Beta', 'Planning', 'Medium'],
    ]);

    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws2, 'Projects');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Parse sheet 1
    const infoSheet1 = parseExcelBuffer(buffer);
    expect(infoSheet1.sheetNames).toEqual(['Summary', 'Projects']);
    expect(infoSheet1.activeSheet).toBe('Summary');
    expect(infoSheet1.parseResult.columns).toEqual(['Department', 'Headcount', 'Budget']);
    expect(infoSheet1.parseResult.rowCount).toBe(2);
    expect(infoSheet1.parseResult.data[0]['Department']).toBe('Engineering');

    // Parse sheet 2
    const infoSheet2 = parseExcelBuffer(buffer, 'Projects');
    expect(infoSheet2.activeSheet).toBe('Projects');
    expect(infoSheet2.parseResult.columns).toEqual(['ProjectName', 'Status', 'RiskLevel']);
    expect(infoSheet2.parseResult.rowCount).toBe(2);
    expect(infoSheet2.parseResult.data[1]['ProjectName']).toBe('Beta');
  });

  it('verifies built-in sample datasets are valid and have high-density business metrics', () => {
    expect(SAMPLE_DATASETS.length).toBeGreaterThanOrEqual(3);

    SAMPLE_DATASETS.forEach((sample) => {
      const parsed = parseCSVContent(sample.csvContent);
      expect(parsed.errors).toEqual([]);
      expect(parsed.rowCount).toBeGreaterThanOrEqual(15);
      expect(parsed.columns.length).toBeGreaterThanOrEqual(5);
    });
  });
});
