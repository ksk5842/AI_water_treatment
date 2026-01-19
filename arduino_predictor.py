import serial
import time
import joblib
import numpy as np

# Configuration
SERIAL_PORT = 'COM3'  # Change to your Arduino port
BAUD_RATE = 9600

# Load ML Model
try:
    model = joblib.load('dose_predictor.pkl')
    scaler = joblib.load('dose_scaler.pkl')
    print("✓ ML Model loaded successfully")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    exit(1)

def predict_dose(turbidity, ph, tds):
    """Predict treatment doses using ML model"""
    # Model expects: ['BOD', 'Nitrate', 'Turbidity', 'pH', 'Conductivity']
    bod_default = 20.0
    nitrate_default = 8.0
    
    input_data = np.array([[bod_default, nitrate_default, turbidity, ph, tds]])
    scaled = scaler.transform(input_data)
    prediction = model.predict(scaled)[0]
    
    return {
        'resin_dose': float(prediction[0]),
        'alum_dose': float(prediction[1])
    }

def main():
    print("=" * 60)
    print("AI Water Treatment - Dosage Predictor")
    print("=" * 60)
    
    try:
        # Connect to Arduino
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)  # Wait for Arduino to initialize
        print(f"✓ Connected to Arduino on {SERIAL_PORT}")
        print("\nReading sensor data...\n")
        
        sample_count = 0
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                
                if line:
                    try:
                        # Parse sensor data: turbidity,pH,TDS
                        parts = line.split(',')
                        if len(parts) == 3:
                            turbidity = float(parts[0])
                            ph = float(parts[1])
                            tds = float(parts[2])
                            
                            sample_count += 1
                            
                            # Predict doses
                            prediction = predict_dose(turbidity, ph, tds)
                            
                            # Display results
                            print(f"\n{'─' * 60}")
                            print(f"Sample #{sample_count} - {time.strftime('%H:%M:%S')}")
                            print(f"{'─' * 60}")
                            print(f"📊 SENSOR READINGS:")
                            print(f"   Turbidity: {turbidity:.2f} NTU")
                            print(f"   pH Level:  {ph:.2f}")
                            print(f"   TDS:       {tds:.0f} ppm")
                            print(f"\n🤖 AI PREDICTIONS:")
                            print(f"   Alum Dose:  {prediction['alum_dose']:.2f} mg/L")
                            print(f"   Resin Dose: {prediction['resin_dose']:.2f} mg/L")
                            
                            # Water quality assessment
                            status = "✓ OPTIMAL" if (6.5 <= ph <= 8.5 and turbidity < 5) else "⚠ NEEDS TREATMENT"
                            print(f"\n💧 Status: {status}")
                            
                    except ValueError as e:
                        print(f"✗ Error parsing data: {line}")
                        
    except serial.SerialException as e:
        print(f"✗ Serial connection error: {e}")
        print(f"\nMake sure:")
        print(f"  1. Arduino is connected to {SERIAL_PORT}")
        print(f"  2. Sensor reader code is uploaded to Arduino")
        print(f"  3. No other program is using the serial port")
    except KeyboardInterrupt:
        print("\n\n✓ Program stopped by user")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("✓ Serial connection closed")

if __name__ == "__main__":
    main()