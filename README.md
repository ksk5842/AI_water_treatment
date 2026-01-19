# AquaFlow AI - Smart Water Treatment System

AI-powered water treatment monitoring and dosage prediction system combining real-time sensor data with machine learning predictions.

## 🌊 Features

- **Real-time Monitoring**: Live gauges for Turbidity, pH, and TDS
- **AI Predictions**: ML-powered Purolite and Alum dosage recommendations
- **Pump Controls**: Manual and automated dosing controls
- **Data History**: Historical sensor data visualization
- **WebSocket**: Real-time bidirectional communication

## 🏗️ Architecture

```
end_prod/
├── backend/           # FastAPI + ML Backend
│   ├── main.py        # API server with WebSocket
│   ├── predictor.py   # ML prediction service
│   └── models/        # Trained ML models
└── frontend/          # React + Vite Frontend
    └── src/
        ├── components/  # UI components
        ├── stores/      # Zustand state
        └── lib/         # API services
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm or pnpm

### Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && pip install -r requirements.txt
```

### Development

```bash
# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/predict` | Get dosage prediction |
| WS | `/ws/sensors` | Real-time sensor stream |

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Test API endpoint
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"turbidity": 0.5, "ph": 7.1, "tds": 186}'
```

## 📊 Sensor Parameters

| Parameter | Unit | Optimal Range |
|-----------|------|---------------|
| Turbidity | NTU | < 1.0 |
| pH | - | 6.5 - 8.5 |
| TDS | mg/L | < 500 |

## 🤖 ML Model

The system uses a RandomForest model trained on water quality data to predict:
- **Purolite Resin Dose**: Ion exchange treatment (mg/L)
- **Alum Dose**: Coagulation treatment (mg/L)

Input features: BOD, Nitrate, Turbidity, pH, Conductivity

## 📝 License

MIT License
