// ppg_sensor.cpp
//
// Implementation of the PPG sensor driver declared in ppg_sensor.h.
//
// Keep this file focused exclusively on sensor I/O. Do NOT implement
// signal processing/PPG algorithms here — that belongs in a future,
// dedicated signal-processing module.

#include "ppg_sensor.h"

bool ppgSensorInit() {
  // TODO: Initialize the sensor communication bus (I2C/SPI).
  // TODO: Write sensor configuration registers (sample rate, LED
  //       current, ADC range, etc.) per the datasheet.
  return false;
}

bool ppgSensorHasData() {
  // TODO: Check sensor interrupt pin state or FIFO/status register to
  //       determine if new sample data is ready.
  return false;
}

bool ppgSensorRead(PpgSample& outSample) {
  // TODO: Read the next sample from the sensor (e.g., pop from FIFO)
  //       and populate outSample.timestampMs / outSample.rawValue.
  (void)outSample;
  return false;
}
