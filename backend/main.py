"""
FastAPI Backend for AquaFlow AI Water Treatment System
Provides REST API and WebSocket endpoints for sensor data and ML predictions.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import json
from datetime import datetime

from predictor import get_predictor, DosePredictor

# ============================================================================
# Pydantic Models
# ============================================================================

class SensorReading(BaseModel):
    """Input sensor reading from Arduino or manual input."""
    turbidity: float = Field(..., ge=0, description="Turbidity in NTU")
    ph: float = Field(..., ge=0, le=14, description="pH level")
    tds: float = Field(..., ge=0, description="Total Dissolved Solids in mg/L")
    bod: Optional[float] = Field(default=25.0, ge=0, description="BOD in mg/L")
    nitrate: Optional[float] = Field(default=10.0, ge=0, description="Nitrate in mg/L")


class PredictionResponse(BaseModel):
    """ML prediction response with dosage recommendations."""
    purolite_dose: float = Field(..., description="Recommended Purolite resin dose in mg/L")
    alum_dose: float = Field(..., description="Recommended Alum dose in mg/L")
    model_loaded: bool = Field(..., description="Whether ML model is loaded")
    timestamp: str = Field(..., description="Prediction timestamp")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    timestamp: str


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AquaFlow AI API",
    description="AI-powered water treatment dosage prediction system",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✓ Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"✗ Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check API health and model status."""
    predictor = get_predictor()
    return HealthResponse(
        status="healthy",
        model_loaded=predictor.is_loaded,
        timestamp=datetime.now().isoformat()
    )


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_dosage(reading: SensorReading):
    """
    Predict optimal chemical dosage based on sensor readings.
    
    Takes water quality parameters and returns recommended
    Purolite resin and Alum doses using the trained ML model.
    """
    predictor = get_predictor()
    
    # Calculate conductivity from TDS (TDS ≈ Conductivity × 0.64)
    conductivity = reading.tds / 0.64
    
    # Get prediction
    purolite_dose, alum_dose = predictor.predict(
        bod=reading.bod,
        nitrate=reading.nitrate,
        turbidity=reading.turbidity,
        ph=reading.ph,
        conductivity=conductivity
    )
    
    return PredictionResponse(
        purolite_dose=round(purolite_dose, 2),
        alum_dose=round(alum_dose, 2),
        model_loaded=predictor.is_loaded,
        timestamp=datetime.now().isoformat()
    )


@app.post("/api/sensor-update")
async def sensor_update(reading: SensorReading):
    """
    Receive sensor update and broadcast to all connected clients.
    Also returns a prediction for the given reading.
    """
    predictor = get_predictor()
    conductivity = reading.tds / 0.64
    
    purolite_dose, alum_dose = predictor.predict(
        bod=reading.bod,
        nitrate=reading.nitrate,
        turbidity=reading.turbidity,
        ph=reading.ph,
        conductivity=conductivity
    )
    
    # Broadcast to WebSocket clients
    update_message = {
        "type": "sensor_update",
        "data": {
            "turbidity": reading.turbidity,
            "ph": reading.ph,
            "tds": reading.tds,
            "purolite_dose": round(purolite_dose, 2),
            "alum_dose": round(alum_dose, 2),
            "timestamp": datetime.now().isoformat()
        }
    }
    
    await manager.broadcast(update_message)
    
    return {"status": "ok", **update_message["data"]}


# ============================================================================
# WebSocket Endpoints
# ============================================================================

@app.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sensor data streaming.
    
    Clients can send sensor readings and receive predictions in real-time.
    Also broadcasts updates to all connected clients.
    """
    await manager.connect(websocket)
    
    predictor = get_predictor()
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "model_loaded": predictor.is_loaded,
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            # Receive sensor data from client
            data = await websocket.receive_json()
            
            if data.get("type") == "sensor_reading":
                reading = data.get("data", {})
                
                turbidity = float(reading.get("turbidity", 0))
                ph = float(reading.get("ph", 7))
                tds = float(reading.get("tds", 0))
                bod = float(reading.get("bod", 25))
                nitrate = float(reading.get("nitrate", 10))
                conductivity = tds / 0.64
                
                # Get prediction
                purolite_dose, alum_dose = predictor.predict(
                    bod=bod,
                    nitrate=nitrate,
                    turbidity=turbidity,
                    ph=ph,
                    conductivity=conductivity
                )
                
                # Send prediction back
                response = {
                    "type": "prediction",
                    "data": {
                        "turbidity": turbidity,
                        "ph": ph,
                        "tds": tds,
                        "purolite_dose": round(purolite_dose, 2),
                        "alum_dose": round(alum_dose, 2),
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                await websocket.send_json(response)
                
                # Broadcast to other clients
                await manager.broadcast(response)
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
