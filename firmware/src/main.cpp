// main.cpp
//
// Entry point for the FellowshipRing device firmware.
//
// Reads the PPG sensor's analog pin and sends samples to the host
// over serial using the protocol defined in serial_protocol.h.

#include <Arduino.h>
#include "ppg_sensor.h"
#include "serial_protocol.h"

PPGSensor sensor(A0);

unsigned long lastSample = 0;

void setup() {
  serialProtocolInit();

  sensor.begin();
}

void loop() {
  if (millis() - lastSample >= 10) {
    lastSample = millis();

    PpgSample sample;
    sample.timestampMs = lastSample;
    sample.rawValue = static_cast<uint32_t>(sensor.readRaw());

    serialProtocolSendSample(sample);
  }
}
