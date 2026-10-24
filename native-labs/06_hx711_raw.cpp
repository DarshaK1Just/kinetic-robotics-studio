// Requires Adafruit HX711. GPIO6 -> DATA; GPIO7 -> SCK.
// Read raw counts first. Calibrate separately; counts are NOT grams.
#include <Arduino.h>
#include <Adafruit_HX711.h>
Adafruit_HX711 adc(6, 7);
void setup() {
  Serial.begin(115200); adc.begin(); Serial.println("raw_A128");
}
void loop() {
  const int32_t value = adc.readChannelBlocking(CHAN_A_GAIN_128);
  Serial.println(value);
  // This API blocks waiting for a conversion. Keep it OUT of a motor-control loop.
}
