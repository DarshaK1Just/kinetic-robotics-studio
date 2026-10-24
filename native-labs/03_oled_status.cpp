// Requires Adafruit SSD1306, Adafruit GFX Library and Adafruit BusIO.
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
Adafruit_SSD1306 screen(128, 64, &Wire, -1);
bool ready = false;
void setup() {
  Serial.begin(115200); Wire.begin(8,9); Wire.setClock(100000);
  ready=screen.begin(SSD1306_SWITCHCAPVCC,0x3C); // Confirm address first.
  if (!ready) Serial.println("DISPLAY_INIT_FAILED");
}
void loop() {
  if (!ready) { delay(1000); return; }
  screen.clearDisplay(); screen.setTextColor(SSD1306_WHITE);
  screen.setTextSize(1); screen.setCursor(0,0); screen.println("BENCH READY");
  screen.setTextSize(2); screen.setCursor(0,20); screen.print(millis()/1000);
  screen.setTextSize(1); screen.println(" sec"); screen.display(); delay(250);
}
