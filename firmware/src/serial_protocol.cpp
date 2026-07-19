// serial_protocol.cpp
//
// Implementation of the host communication protocol declared in
// serial_protocol.h. Keep transport/framing concerns here, separate
// from sensor acquisition logic (ppg_sensor.cpp).

#include "serial_protocol.h"
#include <Arduino.h>

void serialProtocolInit() {
  Serial.begin(115200);
}

void serialProtocolSendSample(const PpgSample &sample) {
  // CSV wire format: "<timestampMs>,<rawValue>\n"
  Serial.print(sample.timestampMs);
  Serial.print(',');
  Serial.println(sample.rawValue);
}
