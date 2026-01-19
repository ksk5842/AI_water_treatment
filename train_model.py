import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib

df = pd.read_csv(r'C:\Users\krish\projects\AI_water_treatment\Water_pond_tanks_2021.csv', encoding='cp1252')

X = df[['BOD (mg/L) (Max)', 'Nitrate N + Nitrite N(mg/L) (Max)','Turbidity(NTU)','pH (Max)', 'Conductivity (S/cm) (Max)']]
y = df[['Purolite A520 resin dose (mg/L)', 'Alum dose (mg/L)']]

for df_split in [X]:
    df_split.replace('-', pd.NA, inplace=True)
    df_split[:] = df_split.apply(pd.to_numeric, errors='coerce')
    df_split.fillna(0, inplace=True)

for col in y.columns:
    y[col] = y[col].replace(['-', '#VALUE!'], pd.NA)
    y[col] = pd.to_numeric(y[col], errors='coerce')
    y[col] = y[col].fillna(0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestRegressor(n_estimators=100,random_state=42)
model.fit(X_train_scaled, y_train)
y_pred = model.predict(X_test_scaled)
print("Mean Squared Error (MSE):\n", mean_squared_error(y_test, y_pred))
print("R2 Score:\n", r2_score(y_test, y_pred))

joblib.dump(model, 'dose_predictor.pkl')
joblib.dump(scaler, 'dose_scaler.pkl')

import pandas as pd

new_data = pd.DataFrame({
    'BOD (mg/L) (Max)': [35, 20, 15, 28, 40],
    'Nitrate N + Nitrite N(mg/L) (Max)': [12, 8, 5, 10, 14],
    'Turbidity(NTU)': [50, 100, 300, 75, 25],
    'pH (Max)': [7.2, 6.8, 7.5, 6.5, 7.0],
    'Conductivity (S/cm) (Max)': [310, 500, 1500, 800, 250]
})
scaled_new = scaler.transform(new_data)
pred = model.predict(scaled_new)
result_df = new_data.copy()
result_df['Pred Purolite (mg/L)'] = pred[:, 0]
result_df['Pred Alum (mg/L)'] = pred[:, 1]
print(result_df.to_string(index=False))
def predict_alum_dose(input_data):  
    import joblib
    model = joblib.load('dose_predictor.pkl')
    scaler = joblib.load('dose_scaler.pkl')
    scaled = scaler.transform([input_data])
    prediction = model.predict(scaled)
    return prediction[0]  
 



