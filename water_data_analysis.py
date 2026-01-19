import pandas as pd
import joblib

# Load data and models
df = pd.read_csv('Water_pond_tanks_2021.csv', encoding='cp1252')
model = joblib.load('dose_predictor.pkl')
scaler = joblib.load('dose_scaler.pkl')

# Clean and prepare data
columns = [
    'BOD (mg/L) (Max)', 'Nitrate N + Nitrite N(mg/L) (Max)',
    'Turbidity(NTU)', 'pH (Max)', 'Conductivity (S/cm) (Max)',
    'Purolite A520 resin dose (mg/L)', 'Alum dose (mg/L)'
]
df = df[columns]
df = df.replace(['-', '#VALUE!'], pd.NA)
df = df.apply(pd.to_numeric, errors='coerce')
df = df.dropna().reset_index(drop=True)

# Select sample data
sample = df.sample(20, random_state=1)

# Features and targets
X = sample[[
    'BOD (mg/L) (Max)', 'Nitrate N + Nitrite N(mg/L) (Max)',
    'Turbidity(NTU)', 'pH (Max)', 'Conductivity (S/cm) (Max)'
]]
y = sample[['Purolite A520 resin dose (mg/L)', 'Alum dose (mg/L)']]

# Predict
X_scaled = scaler.transform(X)
pred = model.predict(X_scaled)

# Add predictions
sample['Actual Purolite'] = y.iloc[:, 0]
sample['Predicted Purolite'] = pred[:, 0]
sample['Actual Alum'] = y.iloc[:, 1]
sample['Predicted Alum'] = pred[:, 1]

# Create tables
purolite_df = sample[[
    'pH (Max)', 'Turbidity(NTU)', 'Conductivity (S/cm) (Max)',
    'BOD (mg/L) (Max)', 'Nitrate N + Nitrite N(mg/L) (Max)',
    'Actual Purolite', 'Predicted Purolite'
]]

alum_df = sample[[
    'pH (Max)', 'Turbidity(NTU)', 'Conductivity (S/cm) (Max)',
    'BOD (mg/L) (Max)', 'Nitrate N + Nitrite N(mg/L) (Max)',
    'Actual Alum', 'Predicted Alum'
]]

# Save or print
print("Purolite Dose Comparison:")
print(purolite_df.to_string(index=False))

print("\nAlum Dose Comparison:")
print(alum_df.to_string(index=False))


