// ESP32-S3; external LED on GPIO4 through 220 ohm to GND.
// Button: GPIO5 to GND; internal pull-up enabled. No motor connected.
#include <Arduino.h>
constexpr int LED = 4, BUTTON = 5;
bool rawOld = HIGH, stable = HIGH, enabled = true, ledState = false;
uint32_t changedAt = 0, blinkAt = 0;
void setup() {
  pinMode(LED, OUTPUT); digitalWrite(LED, LOW);
  pinMode(BUTTON, INPUT_PULLUP); Serial.begin(115200);
}
void loop() {
  const uint32_t now = millis();
  const bool raw = digitalRead(BUTTON);
  if (raw != rawOld) { rawOld = raw; changedAt = now; }
  if ((uint32_t)(now - changedAt) >= 30 && raw != stable) {
    stable = raw;
    if (stable == LOW) { enabled = !enabled; Serial.println(enabled ? "RUN" : "PAUSE"); }
  }
  if (!enabled) { ledState = false; digitalWrite(LED, LOW); }
  else if ((uint32_t)(now - blinkAt) >= 500) {
    blinkAt = now; ledState = !ledState; digitalWrite(LED, ledState);
  }
}
