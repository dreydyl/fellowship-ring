// ppg_sensor.h
//
// Interface for the PPG (photoplethysmography) sensor driver.
//
// This module is responsible ONLY for talking to the physical sensor:
// initialization, configuration, and raw sample acquisition. It must
// remain independent of how samples are transmitted (see
// serial_protocol.h for that concern).
//
// TODO: Define the actual sensor register map / I2C or SPI address
// once the sensor part number is finalized (see docs/hardware.md).

#ifndef PPG_SENSOR_H
#define PPG_SENSOR_H

#include <stdint.h>

// Raw sample read from the PPG sensor.
// TODO: Expand with additional channels (e.g., IR/Red) once the sensor
// model is chosen.
struct PpgSample {
  uint32_t timestampMs;
  uint32_t rawValue;
};

// Initializes the PPG sensor (bus setup, register configuration, etc.).
// Returns true on success, false if the sensor could not be initialized.
//
// TODO: Implement actual bus (I2C/SPI) initialization and sensor
// configuration (sample rate, LED current, etc.).
bool ppgSensorInit();

// Returns true if a new sample is available to be read.
//
// TODO: Implement based on sensor interrupt pin or internal FIFO status.
bool ppgSensorHasData();

// Reads the next available sample from the sensor into `outSample`.
// Returns true if a sample was successfully read.
//
// TODO: Implement actual sensor read (e.g., FIFO pop over I2C/SPI).
bool ppgSensorRead(PpgSample& outSample);

#endif // PPG_SENSOR_H
