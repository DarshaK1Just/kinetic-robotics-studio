// Low-power bench example ONLY. Lift the wheel clear of people and cables.
// GPIO15=AIN1, 16=AIN2, 17=PWMA, 18=STBY. External default-disable required.
// Adafruit TB6612 board: add the documented STBY pull-down/gating.
// 'f' refreshes low-speed drive for 250 ms; any other byte stops.
#include <Arduino.h>
constexpr int IN1=15, IN2=16, PWM=17, ENABLE=18;
constexpr uint32_t TIMEOUT_MS = 250;
uint32_t lastCommand = 0; bool armed = false;
void stopMotor() {
  digitalWrite(ENABLE, LOW); analogWrite(PWM, 0);
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); armed = false;
}
void setup() {
  const int pins[] = {IN1, IN2, PWM, ENABLE};
  for (int pin : pins) { digitalWrite(pin, LOW); pinMode(pin, OUTPUT); }
  Serial.begin(115200); stopMotor(); Serial.println("DISABLED; send f for a short low-power pulse");
}
void loop() {
  while (Serial.available()) {
    const char c = (char)Serial.read();
    if (c == 'f') { lastCommand = millis(); armed = true; }
    else stopMotor();
  }
  if (armed && (uint32_t)(millis() - lastCommand) < TIMEOUT_MS) {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    analogWrite(PWM, 60); digitalWrite(ENABLE, HIGH);
  } else stopMotor();
}
