import { DataType } from '../../types';

/**
 * Determines whether a string represents a valid date.
 */
export const isValidDateString = (val: string): boolean => {
  if (!val || val.length < 4 || !isNaN(Number(val))) return false;
  // Match standard YYYY-MM-DD or YYYY/MM/DD or ISO timestamps
  const isIsoPattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(val);
  const parsed = Date.parse(val);
  return isIsoPattern && !isNaN(parsed);
};

/**
 * Infers semantic data type for a list of sample values.
 */
export const inferColumnType = (columnName: string, values: any[]): DataType => {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'text';

  const stringValues = nonNull.map((v) => String(v).trim());

  // 1. Check Boolean
  const booleanValues = new Set(['true', 'false', '0', '1', 'yes', 'no']);
  const isBoolean = stringValues.every((v) => booleanValues.has(v.toLowerCase()));
  if (isBoolean && stringValues.length > 0) return 'boolean';

  // 2. Check Currency
  const currencyPattern = /^[$€£¥]\s*[-+]?[0-9,]+(\.[0-9]+)?$|^[-+]?[0-9,]+(\.[0-9]+)?\s*[$€£¥]$/;
  const currencyCount = stringValues.filter((v) => currencyPattern.test(v)).length;
  if (currencyCount / stringValues.length >= 0.7) return 'currency';

  // 3. Check Percentage
  const percentagePattern = /^[-+]?[0-9,]+(\.[0-9]+)?\s*%$/;
  const percentageCount = stringValues.filter((v) => percentagePattern.test(v)).length;
  if (percentageCount / stringValues.length >= 0.7) return 'percentage';

  // 4. Check Numeric
  const numericCount = stringValues.filter((v) => {
    const clean = v.replace(/[$,%]/g, '').trim();
    return clean !== '' && !isNaN(Number(clean));
  }).length;
  if (numericCount / stringValues.length >= 0.8) {
    // If 100% unique and name contains "id" or "code", treat as ID
    const uniqueCount = new Set(stringValues).size;
    if (uniqueCount === values.length && /id|key|code|sku/i.test(columnName)) {
      return 'id';
    }
    return 'numeric';
  }

  // 5. Check Date
  const dateCount = stringValues.filter((v) => isValidDateString(v)).length;
  if (dateCount / stringValues.length >= 0.7) return 'date';

  // 6. Check Unique Alphanumeric ID
  const uniqueCount = new Set(stringValues).size;
  const isIdName = /id|uuid|guid|key|code|sku|order_no|ref/i.test(columnName);
  const isIdFormat = stringValues.every(
    (v) =>
      /^[A-Za-z0-9]{8,}-[A-Za-z0-9]{4,}/.test(v) ||
      (/\d/.test(v) && /^[A-Za-z0-9\-_]{3,}$/.test(v))
  );

  if (uniqueCount === values.length && (isIdName || isIdFormat)) {
    return 'id';
  }

  // 7. Check Categorical (low cardinality ratio)
  const cardinalityRatio = uniqueCount / stringValues.length;
  if (cardinalityRatio <= 0.25 || uniqueCount <= 20) {
    return 'categorical';
  }

  return 'text';
};
