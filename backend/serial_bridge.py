"""
Serial Bridge for Arduino to AquaFlow AI Backend
Connects Arduino sensors to the FastAPI backend via WebSocket and Serial port.

Usage:
    python serial_bridge.py --port COM3
    python serial_bridge.py --port COM3 --baud 9600
    python serial_bridge.py --mock  # Use simulated data for testing
"""

import asyncio
import argparse
import json
import random
import sys
from datetime import datetime
from typing import Optional

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    print("⚠ pyserial not installed. Run: pip install pyserial")

try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    print("⚠ websockets not installed. Run: pip install websockets")

import aiohttp


class SerialBridge:
    """Bridge between Arduino Serial and AquaFlow AI Backend."""
    
    def __init__(
        self,
        port: Optional[str] = None,
        baud_rate: int = 9600,
        api_url: str = "http://localhost:8000",
        ws_url: str = "ws://localhost:8000/ws/sensors",
        mock_mode: bool = False
    ):
        self.port = port
        self.baud_rate = baud_rate
        self.api_url = api_url
        self.ws_url = ws_url
        self.mock_mode = mock_mode
        self.serial_conn: Optional[serial.Serial] = None
        self.ws_conn = None
        self.running = False
        
        # Last known values for smooth simulation
        self._mock_turbidity = 0.5
        self._mock_ph = 7.0
        self._mock_tds = 200
    
    @staticmethod
    def list_ports() -> list:
        """List available serial ports."""
        if not SERIAL_AVAILABLE:
            return []
        ports = serial.tools.list_ports.comports()
        return [(p.device, p.description) for p in ports]
    
    def connect_serial(self) -> bool:
        """Connect to Arduino serial port."""
        if self.mock_mode:
            print("🔌 Mock mode enabled - no serial connection needed")
            return True
        
        if not SERIAL_AVAILABLE:
            print("❌ pyserial not available")
            return False
        
        if not self.port:
            # Auto-detect Arduino
            ports = self.list_ports()
            arduino_ports = [p for p, d in ports if 'Arduino' in d or 'CH340' in d or 'USB' in d]
            if arduino_ports:
                self.port = arduino_ports[0]
                print(f"🔍 Auto-detected Arduino on {self.port}")
            else:
                print("❌ No Arduino detected. Available ports:")
                for port, desc in ports:
                    print(f"   {port}: {desc}")
                return False
        
        try:
            self.serial_conn = serial.Serial(
                port=self.port,
                baudrate=self.baud_rate,
                timeout=1
            )
            print(f"✓ Connected to Arduino on {self.port} @ {self.baud_rate} baud")
            return True
        except serial.SerialException as e:
            print(f"❌ Failed to connect to {self.port}: {e}")
            return False
    
    def read_serial_line(self) -> Optional[str]:
        """Read a line from serial port."""
        if self.mock_mode:
            return self._generate_mock_data()
        
        if self.serial_conn and self.serial_conn.in_waiting:
            try:
                line = self.serial_conn.readline().decode('utf-8').strip()
                return line if line else None
            except Exception as e:
                print(f"⚠ Serial read error: {e}")
                return None
        return None
    
    def write_serial(self, data: str) -> bool:
        """Write data to serial port (for sending dose back to Arduino)."""
        if self.mock_mode:
            print(f"📤 Mock: Would send to Arduino: {data}")
            return True
        
        if self.serial_conn:
            try:
                self.serial_conn.write(f"{data}\n".encode('utf-8'))
                print(f"📤 Sent to Arduino: {data}")
                return True
            except Exception as e:
                print(f"❌ Serial write error: {e}")
                return False
        return False
    
    def _generate_mock_data(self) -> str:
        """Generate mock sensor data for testing."""
        # Simulate realistic sensor drift
        self._mock_turbidity += random.uniform(-0.05, 0.05)
        self._mock_turbidity = max(0.1, min(5.0, self._mock_turbidity))
        
        self._mock_ph += random.uniform(-0.1, 0.1)
        self._mock_ph = max(5.5, min(9.0, self._mock_ph))
        
        self._mock_tds += random.randint(-10, 10)
        self._mock_tds = max(50, min(800, self._mock_tds))
        
        return f"{self._mock_turbidity:.2f},{self._mock_ph:.2f},{self._mock_tds}"
    
    def parse_sensor_data(self, line: str) -> Optional[dict]:
        """Parse CSV sensor data from Arduino.
        
        Expected format: turbidity,pH,TDS
        Example: 0.42,7.1,186
        """
        try:
            parts = line.split(',')
            if len(parts) >= 3:
                return {
                    "turbidity": float(parts[0]),
                    "ph": float(parts[1]),
                    "tds": float(parts[2])
                }
        except (ValueError, IndexError) as e:
            print(f"⚠ Failed to parse: {line} - {e}")
        return None
    
    async def send_to_backend(self, sensor_data: dict) -> Optional[dict]:
        """Send sensor data to backend and get prediction."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/api/predict",
                    json=sensor_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        print(f"⚠ Backend returned status {response.status}")
        except aiohttp.ClientError as e:
            print(f"❌ Backend connection error: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
        return None
    
    async def broadcast_via_websocket(self, data: dict):
        """Send data to all connected WebSocket clients via backend."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/api/sensor-update",
                    json=data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status != 200:
                        print(f"⚠ Broadcast failed: {response.status}")
        except Exception as e:
            print(f"⚠ Broadcast error: {e}")
    
    async def run(self):
        """Main loop: read sensors, get predictions, control pump."""
        print("\n" + "="*50)
        print("🌊 AquaFlow AI Serial Bridge")
        print("="*50)
        
        # Connect to serial
        if not self.connect_serial():
            if not self.mock_mode:
                print("\n💡 Tip: Use --mock flag to run without Arduino")
                return
        
        # Check backend health
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.api_url}/api/health") as response:
                    if response.status == 200:
                        health = await response.json()
                        print(f"✓ Backend connected - Model loaded: {health.get('model_loaded', False)}")
                    else:
                        print(f"⚠ Backend returned status {response.status}")
        except Exception as e:
            print(f"❌ Cannot connect to backend at {self.api_url}")
            print(f"   Error: {e}")
            print("\n💡 Make sure the backend is running:")
            print("   python -c \"import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=8000)\"")
            return
        
        self.running = True
        print("\n📡 Reading sensor data...")
        print("-"*50)
        
        try:
            while self.running:
                # Read from Arduino
                line = self.read_serial_line()
                
                if line:
                    sensor_data = self.parse_sensor_data(line)
                    
                    if sensor_data:
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        
                        # Display sensor values
                        print(f"[{timestamp}] Sensors: "
                              f"Turb={sensor_data['turbidity']:.2f} NTU | "
                              f"pH={sensor_data['ph']:.2f} | "
                              f"TDS={sensor_data['tds']:.0f} mg/L", end="")
                        
                        # Get AI prediction
                        prediction = await self.send_to_backend(sensor_data)
                        
                        if prediction:
                            purolite = prediction.get('purolite_dose', 0)
                            alum = prediction.get('alum_dose', 0)
                            print(f" → AI: Purolite={purolite:.2f}, Alum={alum:.2f} mg/L")
                            
                            # Broadcast to frontend via WebSocket
                            await self.broadcast_via_websocket(sensor_data)
                            
                            # Send dose back to Arduino (for code2.ino)
                            # Using Alum dose as the primary treatment
                            self.write_serial(f"{alum:.2f}")
                        else:
                            print(" → AI: [no response]")
                
                # Wait before next reading (match Arduino delay)
                await asyncio.sleep(1.0)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping bridge...")
        finally:
            self.running = False
            if self.serial_conn:
                self.serial_conn.close()
                print("✓ Serial connection closed")
    
    def stop(self):
        """Stop the bridge."""
        self.running = False


def main():
    parser = argparse.ArgumentParser(
        description="Serial Bridge for AquaFlow AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python serial_bridge.py --port COM3           # Windows
  python serial_bridge.py --port /dev/ttyUSB0   # Linux
  python serial_bridge.py --mock                # Test without Arduino
  python serial_bridge.py --list                # List available ports
        """
    )
    
    parser.add_argument("--port", "-p", help="Serial port (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", "-b", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("--api", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--mock", "-m", action="store_true", help="Use mock data (no Arduino)")
    parser.add_argument("--list", "-l", action="store_true", help="List available serial ports")
    
    args = parser.parse_args()
    
    if args.list:
        print("Available serial ports:")
        ports = SerialBridge.list_ports()
        if ports:
            for port, desc in ports:
                print(f"  {port}: {desc}")
        else:
            print("  No ports found")
        return
    
    bridge = SerialBridge(
        port=args.port,
        baud_rate=args.baud,
        api_url=args.api,
        mock_mode=args.mock
    )
    
    asyncio.run(bridge.run())


if __name__ == "__main__":
    main()
