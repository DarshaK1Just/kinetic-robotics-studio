// Requires Adafruit SHT31 Library and Adafruit BusIO.
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <math.h>
Adafruit_SHT31 sensor;
bool ready = false;
void setup() {
  Serial.begin(115200); Wire.begin(8, 9);
  ready = sensor.begin(0x44); Serial.println(ready ? "READY" : "SHT31_NOT_FOUND");
}
void loop() {
  if (!ready) { delay(1000); return; }
  float t = sensor.readTemperature(), rh = sensor.readHumidity();
  if (!isfinite(t) || !isfinite(rh)) Serial.println("SENSOR_INVALID");
  else Serial.printf("{\"device\":\"bench-01\",\"uptime_ms\":%lu,\"temp_C\":%.3f,\"rh_percent\":%.3f}\n",
    (unsigned long)millis(), t, rh);
  delay(1000);
}
