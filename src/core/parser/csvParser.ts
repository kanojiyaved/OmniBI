import Papa from 'papaparse';

export interface ParseResult {
  data: Record<string, any>[];
  columns: string[];
  rowCount: number;
  columnCount: number;
  errors: string[];
  delimiterDetected: string;
}

/**
 * Sanitizes cell values to neutralize spreadsheet formula injections.
 */
export const sanitizeCellValue = (val: any): any => {
  if (typeof val === 'string' && val.length > 0) {
    if (/^[=+@-][a-zA-Z]/.test(val) || val.startsWith('=cmd|')) {
      return `'${val}`;
    }
  }
  return val;
};

/**
 * Normalizes headers: removes BOM, trims, assigns fallback names, and deduplicates.
 */
export const normalizeHeaders = (rawHeaders: string[]): string[] => {
  const seen: Record<string, number> = {};
  return rawHeaders.map((h, idx) => {
    let clean = (h || '').toString().replace(/^\uFEFF/, '').trim();
    if (!clean) {
      clean = `Column_${idx + 1}`;
    }
    if (seen[clean] !== undefined) {
      seen[clean] += 1;
      clean = `${clean}_${seen[clean]}`;
    } else {
      seen[clean] = 1;
    }
    return clean;
  });
};

/**
 * Parses raw CSV/TSV text into structured tabular rows and clean column list.
 */
export const parseCSVContent = (content: string): ParseResult => {
  // Strip BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '').trim();
  if (!cleanContent) {
    return {
      data: [],
      columns: [],
      rowCount: 0,
      columnCount: 0,
      errors: ['File is empty or contains only whitespace'],
      delimiterDetected: ',',
    };
  }

  const parsed = Papa.parse<Record<string, any>>(cleanContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header, index) => {
      const clean = header.trim();
      return clean || `Column_${index + 1}`;
    },
  });

  const rawColumns = parsed.meta.fields || [];
  const columns = normalizeHeaders(rawColumns);

  // Remap row keys to normalized columns and sanitize formula triggers
  const data = parsed.data.map((row) => {
    const cleanRow: Record<string, any> = {};
    rawColumns.forEach((rawCol, idx) => {
      const normalizedKey = columns[idx];
      cleanRow[normalizedKey] = sanitizeCellValue(row[rawCol]);
    });
    return cleanRow;
  });

  const errors = (parsed.errors || []).map((err) => `Row ${err.row}: ${err.message}`);

  return {
    data,
    columns,
    rowCount: data.length,
    columnCount: columns.length,
    errors,
    delimiterDetected: parsed.meta.delimiter || ',',
  };
};
