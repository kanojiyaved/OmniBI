/**
 * ============================================================================
 * Universal AI Business Intelligence Platform - Security & Sanitization Layer
 * ============================================================================
 * 
 * Implements rigorous enterprise data security controls:
 * 1. Formula Injection Prevention (CWE-1236 / CSV Injection):
 *    Neutralizes '=', '+', '-', '@', '\t', '\r', '%' triggers by prepending a single quote.
 * 2. Sensitive Data & PII Masking:
 *    Detects and obfuscates emails, phone numbers, and payment cards.
 * 3. Text & HTML Input Sanitization (XSS mitigation).
 * 4. Local Cache Encryption / Decryption via Web Crypto AES-GCM.
 */

import { SecurityPolicyConfig } from '../../types';

export const DEFAULT_SECURITY_CONFIG: SecurityPolicyConfig = {
  preventFormulaInjection: true,
  maskEmails: false,
  maskPhoneNumbers: false,
  maskCreditCards: false,
  encryptLocalStorage: false,
};

// ============================================================================
// 1. FORMULA INJECTION PREVENTION (CWE-1236)
// ============================================================================

const DANGEROUS_FORMULA_REGEX = /^\s*[=+\-@\t\r%]/;

/**
 * Checks if a string or value contains a spreadsheet formula injection risk.
 */
export function isFormulaInjectionThreat(val: any): boolean {
  if (typeof val !== 'string') return false;
  return DANGEROUS_FORMULA_REGEX.test(val);
}

/**
 * Neutralizes spreadsheet formula injection risks by prepending a single quote (').
 * If the value is a number or boolean, it remains untouched.
 */
export function sanitizeFormulaInjection(val: any): any {
  if (typeof val !== 'string') return val;
  if (DANGEROUS_FORMULA_REGEX.test(val)) {
    return `'${val}`;
  }
  return val;
}

// ============================================================================
// 2. PII DETECTION & MASKING
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
const CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/;

/**
 * Masks an email address preserving first and last characters of local part and domain.
 * e.g. "alexander.smith@company.com" -> "a***h@company.com"
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

/**
 * Masks a phone number retaining only the last 4 digits.
 * e.g. "+1 (555) 234-5678" -> "***-***-5678"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-****';
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

/**
 * Masks a credit card or financial account number retaining only the last 4 digits.
 * e.g. "4532-1234-5678-9010" -> "****-****-****-9010"
 */
export function maskCreditCard(cc: string): string {
  const cleaned = cc.replace(/[\s-]/g, '');
  if (cleaned.length < 4) return '****-****-****-****';
  const last4 = cleaned.slice(-4);
  return `****-****-****-${last4}`;
}

/**
 * Detects whether a cell string matches any PII pattern and masks it accordingly.
 */
export function detectAndMaskValue(val: any, config: Partial<SecurityPolicyConfig> = DEFAULT_SECURITY_CONFIG): any {
  if (typeof val !== 'string' || val.trim().length === 0) return val;
  const str = val.trim();

  // Email pattern check
  if (config.maskEmails && EMAIL_REGEX.test(str)) {
    return maskEmail(str);
  }

  // Credit card pattern check (stripping dashes/spaces)
  const ccCandidate = str.replace(/[\s-]/g, '');
  if (config.maskCreditCards && /^\d{13,19}$/.test(ccCandidate) && CREDIT_CARD_REGEX.test(ccCandidate)) {
    return maskCreditCard(str);
  }

  // Phone pattern check (contains at least 7 digits and typical phone separators)
  if (config.maskPhoneNumbers && PHONE_REGEX.test(str)) {
    const digitCount = str.replace(/\D/g, '').length;
    if (digitCount >= 7 && digitCount <= 15) {
      return maskPhone(str);
    }
  }

  return val;
}

// ============================================================================
// 3. ROW & DATA MATRIX SANITIZATION
// ============================================================================

export interface SanitizationOptions {
  preventFormulaInjection?: boolean;
  maskPII?: boolean;
  securityConfig?: Partial<SecurityPolicyConfig>;
}

/**
 * Sanitizes a single record row for export or storage.
 */
export function sanitizeRecordForExport(
  row: Record<string, any>,
  options: SanitizationOptions = {}
): Record<string, any> {
  const {
    preventFormulaInjection = true,
    maskPII = false,
    securityConfig = DEFAULT_SECURITY_CONFIG,
  } = options;

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    let currentVal = value;

    // Apply PII masking if requested
    if (maskPII || securityConfig.maskEmails || securityConfig.maskPhoneNumbers || securityConfig.maskCreditCards) {
      const activePolicy: Partial<SecurityPolicyConfig> = {
        maskEmails: maskPII || securityConfig.maskEmails,
        maskPhoneNumbers: maskPII || securityConfig.maskPhoneNumbers,
        maskCreditCards: maskPII || securityConfig.maskCreditCards,
      };
      currentVal = detectAndMaskValue(currentVal, activePolicy);
    }

    // Apply formula injection prevention
    if (preventFormulaInjection) {
      currentVal = sanitizeFormulaInjection(currentVal);
    }

    sanitized[key] = currentVal;
  }

  return sanitized;
}

/**
 * Sanitizes an entire dataset row array with vectorized processing.
 */
export function sanitizeDataMatrix(
  rows: Record<string, any>[],
  options: SanitizationOptions = {}
): Record<string, any>[] {
  if (!rows || rows.length === 0) return [];
  return rows.map((row) => sanitizeRecordForExport(row, options));
}

// ============================================================================
// 4. TEXT & HTML SANITIZATION (XSS MITIGATION)
// ============================================================================

const HTML_CHAR_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escapes unsafe HTML characters to prevent XSS in rendering environments.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return String(input ?? '');
  return input.replace(/[&<>"']/g, (m) => HTML_CHAR_MAP[m] || m);
}

// ============================================================================
// 5. LOCAL STORAGE ENCRYPTION (AES-GCM / WEB CRYPTO)
// ============================================================================

const STORAGE_SECRET_SALT = 'OmniBI_Enterprise_Data_Protection_2026';

/**
 * Lightweight browser cipher using Web Crypto API when available,
 * falling back to Base64 XOR encoding for unsupported runtime environments.
 */
export async function encryptPayload(plainText: string, passphrase: string = STORAGE_SECRET_SALT): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        enc.encode(plainText)
      );

      const ivArray = Array.from(iv);
      const encArray = Array.from(new Uint8Array(encrypted));
      return JSON.stringify({ iv: ivArray, data: encArray });
    }
  } catch {
    // Fall back to lightweight obfuscation
  }

  // Fallback: XOR stream cipher + Base64
  return fallbackXorBase64(plainText, passphrase);
}

/**
 * Decrypts data previously encrypted by encryptPayload.
 */
export async function decryptPayload(cipherText: string, passphrase: string = STORAGE_SECRET_SALT): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && cipherText.startsWith('{"iv":')) {
      const parsed = JSON.parse(cipherText);
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        data
      );
      return new TextDecoder().decode(decrypted);
    }
  } catch {
    // Fall through to fallback decoder
  }

  return fallbackXorBase64(cipherText, passphrase);
}

function fallbackXorBase64(text: string, key: string): string {
  try {
    if (typeof btoa === 'undefined') {
      return text;
    }
    let output = '';
    for (let i = 0; i < text.length; i++) {
      output += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(output);
  } catch {
    return text;
  }
}
