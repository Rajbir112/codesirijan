import pandas as pd
import numpy as np
import os

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
import joblib

print("=" * 50)
print("  Hospital Equipment Model - Auto Training")
print("=" * 50)

# ── Paths ──────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
NEW_DATA_FILE  = os.path.join(BASE_DIR, "new_data.csv")
MASTER_DATASET = os.path.join(BASE_DIR, "master_dataset.csv")
MODEL_FILE     = os.path.join(BASE_DIR, "rf_equipment_model.pkl")
ENCODER_FILE   = os.path.join(BASE_DIR, "equipment_encoder.pkl")
SCALER_FILE    = os.path.join(BASE_DIR, "feature_scaler.pkl")
MAX_ROWS       = 10_000   # sliding window cap


# -----------------------------
# LOAD NEW DATA
# -----------------------------

if not os.path.exists(NEW_DATA_FILE):
    print(f"ERROR: {NEW_DATA_FILE} not found. Exiting.")
    exit(1)

new_data = pd.read_csv(NEW_DATA_FILE)
print(f"New batch loaded: {len(new_data)} rows")


# -----------------------------
# MERGE WITH MASTER DATASET
# -----------------------------

if os.path.exists(MASTER_DATASET):
    old_data = pd.read_csv(MASTER_DATASET)
    df = pd.concat([old_data, new_data], ignore_index=True)
    print(f"Merged: {len(old_data)} existing + {len(new_data)} new = {len(df)} rows")
else:
    df = new_data
    print("No master dataset yet - starting fresh.")


# -----------------------------
# SLIDING WINDOW — CAP AT 10,000
# -----------------------------

if len(df) > MAX_ROWS:
    rows_dropped = len(df) - MAX_ROWS
    df = df.iloc[rows_dropped:].reset_index(drop=True)
    print(f"Sliding window: dropped {rows_dropped} oldest rows -> master now has {len(df)} rows")
else:
    print(f"Master dataset size: {len(df)} / {MAX_ROWS} rows")

df.to_csv(MASTER_DATASET, index=False)
print(f"Master dataset saved -> {MASTER_DATASET}")


# -----------------------------
# DROP UNUSED COLUMNS
# -----------------------------

df = df.drop(columns=["recorded_at", "date"], errors="ignore")


# -----------------------------
# REMOVE MISSING VALUES
# -----------------------------

df = df.dropna()


# -----------------------------
# ENCODE EQUIPMENT
# -----------------------------

encoder = LabelEncoder()
df["equipment_encoded"] = encoder.fit_transform(df["equipment"])


# -----------------------------
# BOOLEAN → INTEGER
# -----------------------------

df["is_holiday"] = df["is_holiday"].astype(int)
df["is_weekend"]  = df["is_weekend"].astype(int)


# -----------------------------
# FEATURE SET
# -----------------------------

features = [
    "equipment_encoded",
    "is_holiday",
    "is_weekend",
    "total_patients_last_7_days",
    "total_patients_last_day",
    "total_usage_last_7_days",
    "total_usage_last_day"
]

target = "value"

X = df[features]
y = df[target]


# -----------------------------
# NORMALIZATION
# -----------------------------

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)


# -----------------------------
# TRAIN RANDOM FOREST
# -----------------------------

print("Training Random Forest model...")

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)

model.fit(X_scaled, y)

print("Training complete.")


# -----------------------------
# SAVE MODEL
# -----------------------------

joblib.dump(model,   MODEL_FILE)
joblib.dump(encoder, ENCODER_FILE)
joblib.dump(scaler,  SCALER_FILE)

print(f"Model saved   -> {MODEL_FILE}")
print(f"Encoder saved -> {ENCODER_FILE}")
print(f"Scaler saved  -> {SCALER_FILE}")
print("=" * 50)
print("  Random Forest model updated successfully!")
print("=" * 50)
