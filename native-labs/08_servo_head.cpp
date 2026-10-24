// Requires ESP32Servo. One unloaded hobby servo only; separate rated 5 V supply.
// Signal=GPIO10. Common signal ground. Start with horn removed.
// Serial: c=center, a=-5 degrees, d=+5 degrees, x=detach.
#include <Arduino.h>
#include <ESP32Servo.h>
Servo head; int target=90, current=90; bool enabled=false;
uint32_t lastStep=0;
void setup() { Serial.begin(115200); Serial.println("Horn OFF. Send c to enable centre pulse."); }
void loop() {
  while (Serial.available()) {
    char c=(char)Serial.read();
    if (c=='x') { head.detach(); enabled=false; }
    if (c=='c') {
      if (!enabled) { head.setPeriodHertz(50); head.attach(10,1000,2000); enabled=true; }
      target=90;
    }
    if (enabled && c=='a') target=max(70,target-5);
    if (enabled && c=='d') target=min(110,target+5);
  }
  if (enabled && (uint32_t)(millis()-lastStep)>=20) {
    lastStep=millis();
    if (current<target) ++current; else if (current>target) --current;
    head.write(current);
  }
}
