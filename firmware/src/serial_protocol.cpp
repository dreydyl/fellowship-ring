// serial_protocol.cpp
//
// Implementation of the host communication protocol declared in
// serial_protocol.h. Keep transport/framing concerns here, separate
// from sensor acquisition logic (ppg_sensor.cpp).

#include "serial_protocol.h"
#include <Arduino.h>

void serialProtocolInit() {
  // TODO: Choose an appropriate baud rate / transport and initialize it,
  //       e.g. Serial.begin(115200);
}

void serialProtocolSendSample(const PpgSample& sample) {
  // TODO: Implement the actual wire format (see docs/api.md), e.g.
  //       a length-prefixed binary frame or newline-delimited JSON/CSV.
  (void)sample;
}
