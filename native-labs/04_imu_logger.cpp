// Requires Adafruit LSM6DS, Adafruit Unified Sensor, Adafruit BusIO.
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_LSM6DS3TRC.h>
Adafruit_LSM6DS3TRC imu;
bool ready = false;
void setup() {
  Serial.begin(115200); Wire.begin(8, 9); Wire.setClock(100000);
  ready = imu.begin_I2C(0x6A, &Wire);
  Serial.println(ready ? "ms,ax_mps2,ay_mps2,az_mps2,gx_radps,gy_radps,gz_radps" : "IMU_NOT_FOUND");
}
void loop() {
  if (!ready) { delay(1000); return; }
  sensors_event_t a, g, t; imu.getEvent(&a, &g, &t);
  Serial.printf("%lu,%.5f,%.5f,%.5f,%.5f,%.5f,%.5f\n",
    (unsigned long)millis(), a.acceleration.x, a.acceleration.y,
    a.acceleration.z, g.gyro.x, g.gyro.y, g.gyro.z);
  delay(20);
}
