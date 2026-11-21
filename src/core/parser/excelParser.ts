import * as XLSX from 'xlsx';
import { normalizeHeaders, sanitizeCellValue, ParseResult } from './csvParser';

export interface ExcelWorkbookInfo {
  sheetNames: string[];
  activeSheet: string;
  parseResult: ParseResult;
}

/**
 * Parses an Excel ArrayBuffer and extracts sheet information and sheet tabular data.
 * Guarantees zero execution of formulas, macros, or embedded scripts.
 */
export const parseExcelBuffer = (buffer: ArrayBuffer, targetSheetName?: string): ExcelWorkbookInfo => {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
    cellFormula: false, // Security: Never compute or execute spreadsheet formulas
    cellHTML: false,    // Security: Never execute embedded HTML
    bookVBA: false,     // Security: Never load or execute VBA macros
  });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets or is corrupted.');
  }

  const activeSheet = targetSheetName && sheetNames.includes(targetSheetName)
    ? targetSheetName
    : sheetNames[0];

  const worksheet = workbook.Sheets[activeSheet];
  if (!worksheet) {
    return {
      sheetNames,
      activeSheet,
      parseResult: {
        data: [],
        columns: [],
        rowCount: 0,
        columnCount: 0,
        errors: [`Worksheet "${activeSheet}" is empty`],
        delimiterDetected: 'excel',
      },
    };
  }

  // Convert worksheet to raw json rows
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (!rows || rows.length === 0) {
    return {
      sheetNames,
      activeSheet,
      parseResult: {
        data: [],
        columns: [],
        rowCount: 0,
        columnCount: 0,
        errors: [`Worksheet "${activeSheet}" contains no data rows`],
        delimiterDetected: 'excel',
      },
    };
  }

  const headerRow = rows[0] || [];
  const rawHeaders = headerRow.map((cell: any) => (cell !== null && cell !== undefined ? String(cell) : ''));
  const columns = normalizeHeaders(rawHeaders);

  const dataRows = rows.slice(1);
  const data: Record<string, any>[] = [];

  for (const r of dataRows) {
    if (!r || r.every((c: any) => c === null || c === undefined || c === '')) {
      continue;
    }
    const rowObj: Record<string, any> = {};
    columns.forEach((colName, colIdx) => {
      let val = r[colIdx];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      rowObj[colName] = sanitizeCellValue(val !== undefined ? val : null);
    });
    data.push(rowObj);
  }

  return {
    sheetNames,
    activeSheet,
    parseResult: {
      data,
      columns,
      rowCount: data.length,
      columnCount: columns.length,
      errors: [],
      delimiterDetected: 'excel',
    },
  };
};
