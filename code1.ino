#define TDS_PIN A0
#define PH_PIN A1
#define TURBIDITY_PIN A2
const float VREF = 5.0;
 
void setup() {
  Serial.begin(9600);
}

void loop() {
  int tdsRaw = analogRead(TDS_PIN);
  int phRaw = analogRead(PH_PIN);
  int turbRaw = analogRead(TURBIDITY_PIN);
  float tdsVoltage = tdsRaw * (VREF / 1024.0);
  float phVoltage = phRaw * (VREF / 1024.0);
  float turbVoltage = turbRaw * (VREF / 1024.0);
  float tdsValue = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;
  float phValue = (2.17 * phVoltage + 4.81)-7;
  float turbidity = -340.83 * turbVoltage + 1340.83;

  if (phValue > 14.0) phValue = 14.0;
  if (phValue < 0.0) phValue = 0.0;
  if (turbidity > 5) turbidity = 4.83;

  Serial.print(turbidity, 2);
  Serial.print(",");
  Serial.print(phValue, 2);
  Serial.print(",");
  Serial.print(tdsValue, 0);
  Serial.print("\n");
  delay(1000); 
}