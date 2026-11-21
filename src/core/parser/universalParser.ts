import { parseCSVContent, ParseResult } from './csvParser';
import { parseExcelBuffer } from './excelParser';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 Megabytes limit

const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'py', 'vbs', 'msi', 'dll', 'scr', 'bin', 'jar'
]);

export interface UniversalParseOutput {
  parseResult: ParseResult;
  isExcel: boolean;
  fileFormat: 'csv' | 'xlsx' | 'xls';
  sheetNames: string[];
  activeSheet?: string;
  fileName: string;
  fileSize: number;
}

/**
 * Robust cross-environment helper to read a File/Blob as plain text.
 */
export const readFileAsText = async (file: File): Promise<string> => {
  if (typeof file.text === 'function') {
    return await file.text();
  }
  if (typeof file.arrayBuffer === 'function') {
    const buf = await file.arrayBuffer();
    return new TextDecoder('utf-8').decode(buf);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Robust cross-environment helper to read a File/Blob as an ArrayBuffer.
 */
export const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    return await file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Universal file ingestion pipeline. Detects file format (CSV, XLSX, XLS),
 * enforces resource limits, and parses with security safeguards.
 */
export const parseUploadedFile = async (
  file: File,
  targetSheet?: string
): Promise<UniversalParseOutput> => {
  const fileName = file.name;
  const fileSize = file.size;

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size limit of 50MB (${(fileSize / (1024 * 1024)).toFixed(1)}MB provided).`);
  }

  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (FORBIDDEN_EXTENSIONS.has(extension)) {
    throw new Error(`Security violation: Executable/script file type ".${extension}" is strictly prohibited for ingestion.`);
  }

  if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
    const buffer = await readFileAsArrayBuffer(file);
    const excelInfo = parseExcelBuffer(buffer, targetSheet);
    const format = extension === 'xls' ? 'xls' : 'xlsx';

    return {
      parseResult: excelInfo.parseResult,
      isExcel: true,
      fileFormat: format,
      sheetNames: excelInfo.sheetNames,
      activeSheet: excelInfo.activeSheet,
      fileName,
      fileSize,
    };
  }

  if (['csv', 'tsv', 'txt'].includes(extension) || (file.type && (file.type.includes('text') || file.type.includes('csv')))) {
    const text = await readFileAsText(file);
    const parseResult = parseCSVContent(text);

    return {
      parseResult,
      isExcel: false,
      fileFormat: 'csv',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      fileName,
      fileSize,
    };
  }

  throw new Error(`Unsupported file format: ".${extension}". Only CSV, XLSX, and XLS formats are supported.`);
};

/**
 * Parses multiple files in batch for the queue ingestion system.
 */
export const parseMultipleFiles = async (
  files: File[]
): Promise<UniversalParseOutput[]> => {
  const outputs: UniversalParseOutput[] = [];
  for (const file of files) {
    const result = await parseUploadedFile(file);
    outputs.push(result);
  }
  return outputs;
};
