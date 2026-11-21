import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List

def infer_column_type(series: pd.Series) -> str:
    """Infers semantic data type for a Pandas Series."""
    non_null = series.dropna()
    if len(non_null) == 0:
        return 'text'

    # Check for Boolean
    unique_vals = set(non_null.astype(str).str.strip().str.lower().unique())
    if unique_vals.issubset({'true', 'false', '0', '1', 'yes', 'no'}):
        return 'boolean'

    # Check for Currency (starts with $, €, £, ¥ or ends with currency symbol)
    sample_str = non_null.astype(str).iloc[:50]
    if sample_str.str.contains(r'^\s*[\$€£¥]|[\$€£¥]\s*$', regex=True).mean() > 0.6:
        return 'currency'

    # Check for Percentage
    if sample_str.str.contains(r'%\s*$', regex=True).mean() > 0.6:
        return 'percentage'

    # Check for Numeric
    clean_num = non_null.astype(str).str.replace(r'[\$,%]', '', regex=True).str.strip()
    numeric_count = pd.to_numeric(clean_num, errors='coerce').notna().sum()
    if numeric_count / len(non_null) > 0.8:
        # Check if ID
        if len(non_null.unique()) == len(series) and series.name and 'id' in str(series.name).lower():
            return 'id'
        return 'numeric'

    # Check for Date
    date_count = pd.to_datetime(non_null.astype(str), errors='coerce').notna().sum()
    if date_count / len(non_null) > 0.8:
        return 'date'

    # Check for Unique ID (alphanumeric string with 100% uniqueness)
    if len(non_null.unique()) == len(series) and (
        (series.name and 'id' in str(series.name).lower()) or 
        (sample_str.str.contains(r'^[A-Za-z0-9\-_]{4,}$', regex=True).mean() > 0.8)
    ):
        return 'id'

    # Check for Categorical (cardinality ratio < 0.25 and distinct count <= 50)
    distinct_ratio = len(non_null.unique()) / len(non_null)
    if distinct_ratio < 0.25 or len(non_null.unique()) <= 20:
        return 'categorical'

    return 'text'

def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Generates comprehensive statistical and quality profile of a DataFrame."""
    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_rows = int(df.duplicated().sum())

    missing_cells = int(df.isna().sum().sum())
    total_cells = total_rows * total_cols if total_rows * total_cols > 0 else 1
    missing_percentage = (missing_cells / total_cells) * 100

    columns_profile: Dict[str, Any] = {}
    anomalies: List[Dict[str, Any]] = []

    for col in df.columns:
        series = df[col]
        inferred_type = infer_column_type(series)
        null_count = int(series.isna().sum())
        null_ratio = null_count / total_rows if total_rows > 0 else 0
        distinct_count = int(series.nunique())

        profile: Dict[str, Any] = {
            'name': str(col),
            'inferredType': inferred_type,
            'totalCount': total_rows,
            'nullCount': null_count,
            'nullRatio': round(null_ratio, 4),
            'distinctCount': distinct_count,
            'uniqueRatio': round(distinct_count / total_rows, 4) if total_rows > 0 else 0,
        }

        # Check for High Nulls anomaly
        if null_ratio > 0.4:
            anomalies.append({
                'column': str(col),
                'type': 'high_nulls',
                'severity': 'high' if null_ratio > 0.7 else 'medium',
                'description': f'Column has {round(null_ratio * 100, 1)}% missing values.',
            })

        # Numeric Statistics
        if inferred_type in ['numeric', 'currency', 'percentage']:
            clean_s = pd.to_numeric(
                series.astype(str).str.replace(r'[\$,%]', '', regex=True).str.strip(), 
                errors='coerce'
            ).dropna()

            if len(clean_s) > 0:
                q25 = float(clean_s.quantile(0.25))
                q75 = float(clean_s.quantile(0.75))
                iqr = q75 - q25
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                outliers = clean_s[(clean_s < lower_bound) | (clean_s > upper_bound)]
                outlier_count = int(len(outliers))

                profile.update({
                    'min': float(clean_s.min()),
                    'max': float(clean_s.max()),
                    'mean': float(round(clean_s.mean(), 2)),
                    'median': float(round(clean_s.median(), 2)),
                    'stdDev': float(round(clean_s.std(), 2)) if len(clean_s) > 1 else 0.0,
                    'q25': q25,
                    'q75': q75,
                    'iqr': iqr,
                    'outlierCount': outlier_count,
                })

                if outlier_count > 0:
                    anomalies.append({
                        'column': str(col),
                        'type': 'outliers',
                        'severity': 'medium',
                        'description': f'{outlier_count} statistical outlier(s) detected via IQR bounds [{round(lower_bound, 1)}, {round(upper_bound, 1)}].',
                    })

        # Frequency distribution
        value_counts = series.dropna().astype(str).value_counts().head(5)
        top_freqs = [
            {'value': str(val), 'count': int(count), 'percentage': round((count / total_rows) * 100, 1)}
            for val, count in value_counts.items()
        ]
        profile['topFrequencies'] = top_freqs

        columns_profile[str(col)] = profile

    # Quality Health Score computation
    deduction = 0
    if total_rows > 0:
        deduction += min(25, (duplicate_rows / total_rows) * 100 * 2)
        deduction += min(35, missing_percentage * 1.5)
        deduction += min(20, len(anomalies) * 4)

    overall_score = max(20, min(100, int(100 - deduction)))

    quality_report = {
        'overallScore': overall_score,
        'totalRows': total_rows,
        'totalColumns': total_cols,
        'duplicateRowsCount': duplicate_rows,
        'missingCellsCount': missing_cells,
        'missingDataPercentage': round(missing_percentage, 2),
        'anomaliesDetected': anomalies,
    }

    return {
        'quality': quality_report,
        'profiles': columns_profile,
    }
