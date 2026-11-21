import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
import pandas as pd
import numpy as np
from backend.core.profiler import profile_dataframe, infer_column_type
from backend.core.cleaner import clean_dataframe

def test_infer_column_types():
    s_num = pd.Series([10, 25, 30, 45, 50])
    assert infer_column_type(s_num) == 'numeric'

    s_curr = pd.Series(['$1,200', '$450', '$89.50', '$3,100'])
    assert infer_column_type(s_curr) == 'currency'

    s_pct = pd.Series(['12%', '45.5%', '89%', '5.2%'])
    assert infer_column_type(s_pct) == 'percentage'

    s_date = pd.Series(['2026-01-15', '2026-02-20', '2026-03-25'])
    assert infer_column_type(s_date) == 'date'

    s_bool = pd.Series(['true', 'false', 'true', 'true'])
    assert infer_column_type(s_bool) == 'boolean'

    s_cat = pd.Series(['North', 'South', 'North', 'East', 'South', 'North'] * 10)
    assert infer_column_type(s_cat) == 'categorical'

    s_id = pd.Series(['USR-001', 'USR-002', 'USR-003', 'USR-004'])
    s_id.name = 'user_id'
    assert infer_column_type(s_id) == 'id'

def test_profile_dataframe_statistics_and_outliers():
    # DataFrame with known duplicates, nulls, and an extreme outlier
    data = [
        {'id': 'A1', 'val': 10, 'cat': 'Alpha'},
        {'id': 'A2', 'val': 12, 'cat': 'Alpha'},
        {'id': 'A3', 'val': 11, 'cat': 'Beta'},
        {'id': 'A4', 'val': 13, 'cat': 'Beta'},
        {'id': 'A5', 'val': 1000, 'cat': 'Gamma'}, # Extreme outlier
        {'id': 'A6', 'val': None, 'cat': 'Gamma'}, # Null value
        {'id': 'A1', 'val': 10, 'cat': 'Alpha'},   # Duplicate row
    ]
    df = pd.DataFrame(data)
    profile = profile_dataframe(df)

    quality = profile['quality']
    assert quality['totalRows'] == 7
    assert quality['totalColumns'] == 3
    assert quality['duplicateRowsCount'] == 1
    assert quality['missingCellsCount'] == 1

    val_prof = profile['profiles']['val']
    assert val_prof['min'] == 10
    assert val_prof['max'] == 1000
    assert val_prof['outlierCount'] >= 1

    # Quality score should reflect duplicates and missing data
    assert quality['overallScore'] < 100

def test_clean_dataframe_operations():
    data = [
        {'id': '1', 'salary': 100, 'dept': ' engineering '},
        {'id': '2', 'salary': 200, 'dept': 'SALES'},
        {'id': '3', 'salary': None, 'dept': 'engineering'},
        {'id': '1', 'salary': 100, 'dept': ' engineering '}, # Duplicate
    ]
    df = pd.DataFrame(data)

    # 1. Drop duplicates
    res_dup = clean_dataframe(df, 'drop_duplicates', {})
    assert res_dup['rowCount'] == 3
    assert 'duplicate' in res_dup['summary'].lower()

    # 2. Impute missing values with mean
    cleaned_df = pd.DataFrame(res_dup['cleaned_data'])
    res_impute = clean_dataframe(cleaned_df, 'impute_missing', {'column': 'salary', 'strategy': 'mean'})
    imputed_df = pd.DataFrame(res_impute['cleaned_data'])
    assert imputed_df['salary'].isna().sum() == 0
    assert float(imputed_df.loc[2, 'salary']) == 150.0 # (100 + 200) / 2

    # 3. Standardize categories (trim & title case)
    res_std = clean_dataframe(imputed_df, 'standardize_categories', {'column': 'dept', 'mode': 'title'})
    std_df = pd.DataFrame(res_std['cleaned_data'])
    assert list(std_df['dept']) == ['Engineering', 'Sales', 'Engineering']

    # 4. Verify original df was not mutated
    assert len(df) == 4
    assert df['salary'].isna().sum() == 1
