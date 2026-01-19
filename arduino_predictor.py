

import serial
import numpy as np
import joblib
import time


model = joblib.load('dose_predictor.pkl')
scaler = joblib.load('dose_scaler.pkl')


ser = serial.Serial('COM3', 9600, timeout=1)
time.sleep(2)  

print("Reading from Arduino...")

while True:
    try:
        line = ser.readline().decode('utf-8').strip()
        if line:
            print("Raw input:", line)
            parts = line.split(',')
            if len(parts) == 4:
                bod = float(parts[0])
                nitrate = float(parts[1])
                ph = float(parts[2])
                cond = float(parts[3])

                input_data = np.array([[bod, nitrate, ph, cond]])
                scaled = scaler.transform(input_data)
                prediction = model.predict(scaled)[0]

                print(f"BOD: {bod:.1f}, Nitrate: {nitrate:.1f}, pH: {ph:.1f}, Conductivity: {cond:.1f} => "
                      f"H2O2 Dose: {prediction[0]:.2f} mg/L, Resin Dose: {prediction[1]:.2f} mg/L")

    except KeyboardInterrupt:
        print("Stopped by user.")
        break
    except Exception as e:
        print("Error:", e)