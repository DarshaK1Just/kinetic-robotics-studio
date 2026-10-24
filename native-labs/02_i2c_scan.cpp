// Low-voltage bench scanner; power every breakout from 3.3 V in this lab.
#include <Arduino.h>
#include <Wire.h>
void setup() {
  Serial.begin(115200); delay(300);
  Wire.begin(8, 9); Wire.setClock(100000);
  Serial.println("I2C scan: SDA=8 SCL=9, 100 kHz");
  unsigned count = 0;
  for (uint8_t address = 8; address < 120; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("ACK at 0x%02X\n", address); ++count;
    }
  }
  Serial.printf("%u addresses acknowledged. ACK is not a full sensor test.\n", count);
}
void loop() { delay(1000); }
