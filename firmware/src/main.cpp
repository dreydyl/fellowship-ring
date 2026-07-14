// main.cpp
//
// Entry point for the FellowshipRing device firmware.
//
// This file only wires together the two independent modules:
//   - ppg_sensor:      sensor initialization and raw data acquisition.
//   - serial_protocol: framing/transmission of data to the host app.
//
// It intentionally contains no sensor-specific or protocol-specific
// logic itself — see ppg_sensor.h/.cpp and serial_protocol.h/.cpp.

#include <Arduino.h>
#include "ppg_sensor.h"
#include "serial_protocol.h"

void setup() {
  serialProtocolInit();

  // TODO: Handle sensor initialization failure (e.g., blink an error
  //       LED or retry) once ppgSensorInit() is implemented.
  ppgSensorInit();
}

void loop() {
  // TODO: Replace with a proper sampling loop once ppgSensorHasData()/
  //       ppgSensorRead() are implemented (e.g., timed polling or
  //       interrupt-driven acquisition).
  if (ppgSensorHasData()) {
    PpgSample sample{};
    if (ppgSensorRead(sample)) {
      serialProtocolSendSample(sample);
    }
  }
}
