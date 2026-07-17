// main.cpp
//
// Entry point for the FellowshipRing device firmware.
//
// For now this just does a raw hardware smoke test: read the PPG
// sensor's analog pin and print the raw value over serial. Once this
// is confirmed working, serial_protocol.cpp will be implemented to
// send structured (JSON) frames instead of plain integers.

#include <Arduino.h>
#include "ppg_sensor.h"

PPGSensor sensor(A0);

unsigned long lastSample = 0;

void setup() {
  Serial.begin(115200);

  sensor.begin();
}

void loop() {
  if (millis() - lastSample >= 10) {
    lastSample = millis();

    int raw = sensor.readRaw();

    Serial.println(raw);
  }
}
