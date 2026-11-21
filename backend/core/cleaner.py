import pandas as pd
import numpy as np
from typing import Dict, Any, List

def clean_dataframe(
    df: pd.DataFrame, 
    action_type: str, 
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """Applies pure functional cleaning transformations to a Pandas DataFrame."""
    cleaned = df.copy()
    diff_summary = ""

    if action_type == 'drop_duplicates':
        before = len(cleaned)
        cleaned = cleaned.drop_duplicates()
        removed = before - len(cleaned)
        diff_summary = f"Removed {removed} duplicate row(s)."

    elif action_type == 'impute_missing':
        col = params.get('column')
        strategy = params.get('strategy', 'mean')
        custom_val = params.get('customValue')

        if col in cleaned.columns:
            null_count = int(cleaned[col].isna().sum())
            if strategy == 'mean':
                num_series = pd.to_numeric(cleaned[col], errors='coerce')
                val = num_series.mean()
                cleaned[col] = cleaned[col].fillna(val)
                diff_summary = f"Imputed {null_count} nulls in '{col}' with mean ({round(val, 2)})."
            elif strategy == 'median':
                num_series = pd.to_numeric(cleaned[col], errors='coerce')
                val = num_series.median()
                cleaned[col] = cleaned[col].fillna(val)
                diff_summary = f"Imputed {null_count} nulls in '{col}' with median ({round(val, 2)})."
            elif strategy == 'mode':
                val = cleaned[col].mode()[0] if len(cleaned[col].mode()) > 0 else 'Unknown'
                cleaned[col] = cleaned[col].fillna(val)
                diff_summary = f"Imputed {null_count} nulls in '{col}' with mode ('{val}')."
            elif strategy == 'constant':
                cleaned[col] = cleaned[col].fillna(custom_val or 'Unknown')
                diff_summary = f"Imputed {null_count} nulls in '{col}' with constant ('{custom_val}')."
            elif strategy == 'drop_rows':
                cleaned = cleaned.dropna(subset=[col])
                diff_summary = f"Dropped {null_count} row(s) containing missing values in '{col}'."

    elif action_type == 'standardize_categories':
        col = params.get('column')
        mode = params.get('mode', 'title') # 'title' or 'lower' or 'trim'
        if col in cleaned.columns:
            str_series = cleaned[col].astype(str).str.strip()
            if mode == 'title':
                cleaned[col] = str_series.str.title()
            elif mode == 'lower':
                cleaned[col] = str_series.str.lower()
            elif mode == 'upper':
                cleaned[col] = str_series.str.upper()
            else:
                cleaned[col] = str_series
            diff_summary = f"Standardized category casing in '{col}' ({mode})."

    elif action_type == 'convert_types':
        col = params.get('column')
        target_type = params.get('targetType')
        if col in cleaned.columns:
            if target_type == 'numeric':
                cleaned[col] = pd.to_numeric(
                    cleaned[col].astype(str).str.replace(r'[\$,%]', '', regex=True).str.strip(),
                    errors='coerce'
                )
                diff_summary = f"Converted column '{col}' to numeric."
            elif target_type == 'date':
                cleaned[col] = pd.to_datetime(cleaned[col], errors='coerce').dt.strftime('%Y-%m-%d')
                diff_summary = f"Converted column '{col}' to standard ISO Date."

    return {
        'cleaned_data': cleaned.to_dict(orient='records'),
        'rowCount': len(cleaned),
        'columnCount': len(cleaned.columns),
        'summary': diff_summary
    }
