import serial
import time
from train_model import predict_alum_dose  

arduino = serial.Serial('COM5', 9600) 
time.sleep(2)
DEFAULT_BOD = 25.0
DEFAULT_NITRATE = 10.0
while True:
    if arduino.in_waiting:
        try:
           
            line = arduino.readline().decode().strip()
            print("From Arduino:", line)
            turbidity, pH, tds = map(float, line.split(','))
            conductivity= tds/0.64
            input_features = [DEFAULT_BOD, DEFAULT_NITRATE,turbidity, pH,conductivity]

            alum_dose = predict_alum_dose(input_features)
            print(f"{float(alum_dose[0]):.2f}")  

            arduino.write(f"{alum_dose[0]:.2f}\n".encode())

        except Exception as e:
            print("Error:", e)

