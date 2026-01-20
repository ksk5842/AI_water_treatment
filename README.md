# AquaFlow AI - Smart Water Treatment System

AI-powered water treatment monitoring and dosage prediction system combining real-time Arduino sensor data with machine learning predictions.

![Dashboard](https://img.shields.io/badge/Status-Production-brightgreen) ![Arduino](https://img.shields.io/badge/Arduino-Compatible-blue) ![ML](https://img.shields.io/badge/ML-RandomForest-orange)

## 🌊 Features

- **Real-time Monitoring**: Live gauges for Turbidity, pH, and TDS from Arduino sensors
- **AI Predictions**: ML-powered Purolite and Alum dosage recommendations
- **WebSocket Streaming**: Real-time bidirectional communication
- **Auto-Dosing Mode**: Automatically apply AI recommendations
- **Data History**: Historical sensor data visualization

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Arduino** with sensors connected (Turbidity, pH, TDS)

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd end_prod

# Install Python dependencies (creates virtual environment)
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

# Install Python packages
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Connect Arduino

1. Upload one of the Arduino sketches to your board:
   - `code1.ino` - Basic sensor reading
   - `code2.ino` - Sensor reading with dose feedback
   - `code3.ino` - Simplified version

2. Connect Arduino via USB and note the COM port (e.g., `COM3`)

3. Verify connection:
```bash
# Activate venv first, then:
cd backend
python serial_bridge.py --list
```

---

## 🎮 Running the Project

### Option A: Run in Arduino Mode (Recommended)

Open **3 separate terminals** and run:

**Terminal 1 - Backend API:**
```bash
cd end_prod
.\.venv\Scripts\Activate.ps1
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd end_prod/frontend
npm run dev
```

**Terminal 3 - Arduino Serial Bridge:**
```bash
cd end_prod
.\.venv\Scripts\Activate.ps1
cd backend
python serial_bridge.py --port COM3
```
> Replace `COM3` with your Arduino's COM port

### Option B: Run Without Arduino (Mock Mode)

For testing without hardware:

**Terminal 1 - Backend:**
```bash
cd end_prod/backend
..\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd end_prod/frontend
npm run dev
```

**Terminal 3 - Mock Sensor Data:**
```bash
cd end_prod/backend
..\.venv\Scripts\Activate.ps1
python serial_bridge.py --mock
```

---

## 🌐 Access Points

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

---

## 📡 Arduino Data Format

The Arduino should send sensor readings via Serial in CSV format:

```
turbidity,pH,TDS
```

**Example:**
```
0.42,7.1,186
```

**Baud Rate:** 9600

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check & model status |
| POST | `/api/predict` | Get dosage prediction |
| POST | `/api/sensor-update` | Push sensor data & broadcast |
| WS | `/ws/sensors` | Real-time WebSocket stream |

### Example Prediction Request

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"turbidity": 0.5, "ph": 7.1, "tds": 186}'
```

---

## 🧪 Sensor Optimal Ranges

| Parameter | Unit | Optimal Range |
|-----------|------|---------------|
| Turbidity | NTU | < 1.0 |
| pH | - | 6.5 - 8.5 |
| TDS | mg/L | < 500 |

---

## 🤖 ML Model

The system uses a **RandomForest** model trained on water quality data to predict:

- **Purolite Resin Dose**: Ion exchange treatment (mg/L)
- **Alum Dose**: Coagulation treatment (mg/L)

**Input Features:** BOD, Nitrate, Turbidity, pH, Conductivity

---

## 🔧 Troubleshooting

### Backend 422 Error
The backend validation was updated to accept negative sensor values (common with uncalibrated sensors).

### Arduino Not Detected
```bash
python serial_bridge.py --list
```
Ensure drivers are installed for your Arduino board.

### WebSocket Connection Failed
Make sure the backend is running before starting the frontend or serial bridge.

---

## 📁 Project Structure

```
end_prod/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── predictor.py         # ML prediction service
│   ├── serial_bridge.py     # Arduino-to-backend bridge
│   ├── models/              # Trained ML models
│   └── requirements.txt     # Python dependencies
├── frontend/
│   └── src/
│       ├── components/      # React UI components
│       ├── stores/          # Zustand state management
│       ├── hooks/           # Custom React hooks
│       └── lib/             # API services
├── code1.ino               # Arduino sketch (basic)
├── code2.ino               # Arduino sketch (with feedback)
├── code3.ino               # Arduino sketch (simple)
└── package.json            # npm scripts
```

---

## 📝 License

MIT License
