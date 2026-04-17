import sys
import json
import os
import numpy as np
import joblib
import warnings

# Suppress sklearn warnings about feature names
warnings.filterwarnings('ignore')

def main():
    # Read JSON payload from Standard Input instead of command-line args (prevents Windows quote corruption)
    input_json = sys.stdin.read()
    
    if not input_json or not input_json.strip():
        print(json.dumps([{"error": "No input data provided locally to python"}]))
        sys.exit(0)
    
    try:
        requests = json.loads(input_json)
    except Exception as e:
        print(json.dumps([{"error": "Invalid JSON input correctly: " + str(e)}]))
        sys.exit(0)

    BASE_DIR = r"c:\Users\USER\OneDrive\Desktop\codesirijan"
    MODEL_FILE = os.path.join(BASE_DIR, "rf_equipment_model.pkl")
    ENCODER_FILE = os.path.join(BASE_DIR, "equipment_encoder.pkl")
    SCALER_FILE = os.path.join(BASE_DIR, "feature_scaler.pkl")

    if not os.path.exists(MODEL_FILE) or not os.path.exists(ENCODER_FILE) or not os.path.exists(SCALER_FILE):
        print(json.dumps([{"error": "Model files missing. Ensure training has completed at least once."}]))
        sys.exit(0)

    try:
        model = joblib.load(MODEL_FILE)
        encoder = joblib.load(ENCODER_FILE)
        scaler = joblib.load(SCALER_FILE)
    except Exception as e:
        print(json.dumps([{"error": "Failed to load model: " + str(e)}]))
        sys.exit(0)

    results = []
    
    for req in requests:
        equipment = req.get("equipment")
        try:
            # Handle entirely new equipment types the model hasn't seen yet
            try:
                eq_encoded = encoder.transform([equipment])[0]
            except ValueError:
                # Fallback to the first encoded class if the equipment was never in training data
                eq_encoded = 0 
                
            input_data = np.array([[
                eq_encoded,
                int(req.get("isHoliday", False)),
                int(req.get("isWeekend", False)),
                req.get("totalPatientsLast7Days", 0),
                req.get("totalPatientsLastDay", 0),
                req.get("totalUsageLast7Days", 0),
                req.get("totalUsageLastDay", 0)
            ]])
            
            input_scaled = scaler.transform(input_data)
            prediction = model.predict(input_scaled)
            pred_value = max(0, int(round(prediction[0])))  # Ensure demand is non-negative
            
            results.append({
                "equipment": equipment,
                "predictedDemand": pred_value
            })
        except Exception as e:
            results.append({
                "equipment": equipment,
                "error": str(e)
            })

    # Print pure JSON output for the Java backend to parse
    print(json.dumps(results))

if __name__ == "__main__":
    main()
