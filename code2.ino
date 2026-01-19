#define TDS_PIN A0
#define PH_PIN A1
#define TURBIDITY_PIN A2

const float VREF = 5.0;
int relayPin = 7;
float flowRate = 2.5; 
float alumConcentration = 50.0;
float waterVolume = 2.0; 

void setup() {
  Serial.begin(9600);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
}

void loop() {
  
  int tdsRaw = analogRead(TDS_PIN);
  int turbRaw = analogRead(TURBIDITY_PIN);

  float tdsVoltage = tdsRaw * (VREF / 1024.0);
  float turbVoltage = turbRaw * (VREF / 1024.0);

  float tdsValue = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;
  float turbidity = -344.83 * turbVoltage + 1344.83;
  if (turbidity < 0) turbidity = 0;

  Serial.print(tdsValue, 2);
  Serial.print(",");
  Serial.println(turbidity, 2);

  while (Serial.available() == 0);
  float dose = Serial.parseFloat(); 
  float totalAlumMg = dose * waterVolume;
  float volumeToPump = totalAlumMg / alumConcentration;
  float pumpTime = volumeToPump / flowRate;

  digitalWrite(relayPin, HIGH);
  delay(pumpTime * 1000);
  digitalWrite(relayPin, LOW);

  delay(10000); 
} with pump actuation