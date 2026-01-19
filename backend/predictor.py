"""
ML Prediction Service for Water Treatment Dosage
Wraps the trained RandomForest model for chemical dosage prediction.
"""

import joblib
import numpy as np
from pathlib import Path
from typing import Tuple

class DosePredictor:
    """Predicts optimal Purolite resin and Alum doses based on water quality parameters."""
    
    def __init__(self, model_path: str = None, scaler_path: str = None):
        """
        Initialize the predictor by loading the trained model and scaler.
        
        Args:
            model_path: Path to the trained model pickle file
            scaler_path: Path to the scaler pickle file
        """
        base_path = Path(__file__).parent / "models"
        
        self.model_path = model_path or str(base_path / "dose_predictor.pkl")
        self.scaler_path = scaler_path or str(base_path / "dose_scaler.pkl")
        
        self.model = None
        self.scaler = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model and scaler from disk."""
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            print(f"✓ Model loaded from {self.model_path}")
        except FileNotFoundError as e:
            print(f"⚠ Model files not found: {e}")
            self.model = None
            self.scaler = None
    
    def predict(
        self,
        bod: float,
        nitrate: float,
        turbidity: float,
        ph: float,
        conductivity: float
    ) -> Tuple[float, float]:
        """
        Predict optimal chemical doses based on water quality parameters.
        
        Args:
            bod: Biological Oxygen Demand (mg/L)
            nitrate: Nitrate N + Nitrite N concentration (mg/L)
            turbidity: Water turbidity (NTU)
            ph: pH level
            conductivity: Electrical conductivity (S/cm)
        
        Returns:
            Tuple of (purolite_dose, alum_dose) in mg/L
        """
        if self.model is None or self.scaler is None:
            # Return default values if model not loaded
            return self._calculate_fallback(turbidity, ph, conductivity)
        
        # Prepare input features in the correct order
        # Model expects: [BOD, Nitrate, Turbidity, pH, Conductivity]
        input_features = np.array([[bod, nitrate, turbidity, ph, conductivity]])
        
        # Scale the input
        scaled_input = self.scaler.transform(input_features)
        
        # Make prediction
        prediction = self.model.predict(scaled_input)[0]
        
        # Ensure non-negative values
        purolite_dose = max(0, float(prediction[0]))
        alum_dose = max(0, float(prediction[1]))
        
        return purolite_dose, alum_dose
    
    def _calculate_fallback(
        self,
        turbidity: float,
        ph: float,
        conductivity: float
    ) -> Tuple[float, float]:
        """
        Fallback calculation when ML model is not available.
        Uses simplified heuristics based on water treatment standards.
        """
        # Basic heuristic calculations
        base_alum = 10.0
        
        # Adjust based on turbidity (higher turbidity = more alum)
        alum_dose = base_alum + (turbidity * 0.5)
        
        # Adjust based on pH (far from neutral = more adjustment)
        ph_deviation = abs(ph - 7.0)
        alum_dose += ph_deviation * 2
        
        # Purolite for ion exchange (based on conductivity/TDS)
        tds_estimate = conductivity * 0.64
        purolite_dose = tds_estimate * 0.01
        
        return round(purolite_dose, 2), round(alum_dose, 2)
    
    @property
    def is_loaded(self) -> bool:
        """Check if the model is properly loaded."""
        return self.model is not None and self.scaler is not None


# Singleton instance for reuse
_predictor_instance = None

def get_predictor() -> DosePredictor:
    """Get the singleton predictor instance."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = DosePredictor()
    return _predictor_instance
