export interface CleaningResult {
  cleanedData: Record<string, any>[];
  summary: string;
  affectedRows: number;
}

export type ImputeStrategy = 'mean' | 'median' | 'mode' | 'constant' | 'drop_rows';

/**
 * Drops exact duplicate rows from a dataset.
 */
export const dropDuplicateRows = (data: Record<string, any>[]): CleaningResult => {
  const seen = new Set<string>();
  const cleaned: Record<string, any>[] = [];

  for (const row of data) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push({ ...row });
    }
  }

  const removed = data.length - cleaned.length;
  return {
    cleanedData: cleaned,
    summary: `Removed ${removed} duplicate row(s).`,
    affectedRows: removed,
  };
};

/**
 * Imputes missing values in a column using a statistical strategy or drops null rows.
 */
export const imputeMissingValues = (
  data: Record<string, any>[],
  columnName: string,
  strategy: ImputeStrategy,
  customConstant?: any
): CleaningResult => {
  let fillValue: any = customConstant ?? 'Unknown';
  let affected = 0;

  if (strategy === 'drop_rows') {
    const cleaned = data.filter((row) => {
      const val = row[columnName];
      const isMissing = val === null || val === undefined || val === '';
      if (isMissing) affected++;
      return !isMissing;
    });

    return {
      cleanedData: cleaned,
      summary: `Dropped ${affected} row(s) with missing "${columnName}".`,
      affectedRows: affected,
    };
  }

  const nonNulls = data
    .map((r) => r[columnName])
    .filter((v) => v !== null && v !== undefined && v !== '');

  if (strategy === 'mean') {
    const nums = nonNulls.map(Number).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      fillValue = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
    }
  } else if (strategy === 'median') {
    const nums = nonNulls.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
    if (nums.length > 0) {
      const mid = Math.floor(nums.length / 2);
      fillValue = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
    }
  } else if (strategy === 'mode') {
    const counts: Record<string, number> = {};
    nonNulls.forEach((v) => {
      counts[String(v)] = (counts[String(v)] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      fillValue = sorted[0][0];
    }
  }

  const cleaned = data.map((row) => {
    const val = row[columnName];
    if (val === null || val === undefined || val === '') {
      affected++;
      return { ...row, [columnName]: fillValue };
    }
    return { ...row };
  });

  return {
    cleanedData: cleaned,
    summary: `Imputed ${affected} missing cell(s) in "${columnName}" using ${strategy} (${fillValue}).`,
    affectedRows: affected,
  };
};

/**
 * Standardizes categorical string columns (trims whitespace, converts to title case or lower case).
 */
export const standardizeCategories = (
  data: Record<string, any>[],
  columnName: string,
  mode: 'title' | 'lower' | 'upper' = 'title'
): CleaningResult => {
  let affected = 0;

  const cleaned = data.map((row) => {
    const val = row[columnName];
    if (typeof val === 'string') {
      const trimmed = val.trim();
      let formatted = trimmed;
      if (mode === 'title') {
        formatted = trimmed.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      } else if (mode === 'lower') {
        formatted = trimmed.toLowerCase();
      } else if (mode === 'upper') {
        formatted = trimmed.toUpperCase();
      }

      if (formatted !== val) affected++;
      return { ...row, [columnName]: formatted };
    }
    return { ...row };
  });

  return {
    cleanedData: cleaned,
    summary: `Standardized ${affected} string value(s) in "${columnName}" to ${mode} case.`,
    affectedRows: affected,
  };
};

/**
 * Converts / casts a column into a specified target data type.
 */
export const convertColumnType = (
  data: Record<string, any>[],
  columnName: string,
  targetType: 'numeric' | 'date' | 'string' | 'boolean'
): CleaningResult => {
  let affected = 0;

  const cleaned = data.map((row) => {
    const val = row[columnName];
    if (val === null || val === undefined || val === '') {
      return { ...row };
    }

    let converted = val;

    if (targetType === 'numeric') {
      const cleanStr = String(val).replace(/[$€£¥,%\s]/g, '').trim();
      const num = Number(cleanStr);
      if (!isNaN(num)) {
        converted = num;
        if (converted !== val) affected++;
      }
    } else if (targetType === 'date') {
      const parsedTime = Date.parse(String(val));
      if (!isNaN(parsedTime)) {
        converted = new Date(parsedTime).toISOString().split('T')[0];
        if (converted !== val) affected++;
      }
    } else if (targetType === 'boolean') {
      const s = String(val).trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(s)) {
        converted = true;
        affected++;
      } else if (['false', '0', 'no', 'n'].includes(s)) {
        converted = false;
        affected++;
      }
    } else if (targetType === 'string') {
      converted = String(val);
      if (typeof val !== 'string') affected++;
    }

    return { ...row, [columnName]: converted };
  });

  return {
    cleanedData: cleaned,
    summary: `Converted "${columnName}" to ${targetType} format (affected ${affected} values).`,
    affectedRows: affected,
  };
};
