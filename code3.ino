const int relayPin = 7;
const float flowRate = 5.0;  
const float doseAmount = 25.0; //We can adjust this according to the dose predicted by ML model

void setup() {
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW); 
  delay(2000);  
}

void loop() {
  float duration = doseAmount / flowRate;  
  int duration_ms = (int)(duration * 1000); 

  digitalWrite(relayPin, HIGH);
  delay(duration_ms);  
  digitalWrite(relayPin, LOW);

  while (1); 
}