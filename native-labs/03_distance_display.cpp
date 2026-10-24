// Requires Adafruit SSD1306, Adafruit GFX Library, Adafruit VL53L0X.
// Bench example, not a collision-prevention safety system.
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_VL53L0X.h>
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_VL53L0X sensor;
constexpr uint8_t OLED_ADDRESS = 0x3C; // Verify with the scanner.
bool displayOK = false, sensorOK = false;
void setup() {
  Serial.begin(115200); Wire.begin(8, 9); Wire.setClock(100000);
  displayOK = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  sensorOK = sensor.begin(0x29, false, &Wire);
  Serial.printf("display=%d distance_sensor=%d\n", displayOK, sensorOK);
}
void loop() {
  bool valid = false; uint16_t mm = 0;
  if (sensorOK) {
    VL53L0X_RangingMeasurementData_t m;
    sensor.rangingTest(&m, false);
    valid = (m.RangeStatus == 0); mm = m.RangeMilliMeter;
  }
  if (valid) Serial.printf("distance_mm=%u\n", mm);
  else Serial.println("NO_VALID_RANGE");
  if (displayOK) {
    display.clearDisplay(); display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE); display.setCursor(0, 0);
    display.println("DISTANCE BENCH");
    display.setTextSize(2);
    if (valid) { display.print(mm); display.println(" mm"); }
    else display.println("INVALID");
    display.display();
  }
  delay(100);
}
