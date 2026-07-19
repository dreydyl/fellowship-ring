// serial_protocol.h
//
// Interface for the host communication protocol (over USB serial).
//
// This module is responsible ONLY for framing and transmitting data to
// the host application (web app) — it has no knowledge of how sensor
// samples are acquired (see ppg_sensor.h for that concern).
//
// Wire format: plain-text CSV, one sample per line:
//   "<timestampMs>,<rawValue>\n"
// e.g. "1234,567\n"
// Transport: USB CDC serial at 115200 baud.

#ifndef SERIAL_PROTOCOL_H
#define SERIAL_PROTOCOL_H

#include <stdint.h>
#include "ppg_sensor.h"

// Initializes the serial communication channel (Serial.begin(115200)).
void serialProtocolInit();

// Encodes and sends a single PPG sample to the host as a CSV line:
// "<timestampMs>,<rawValue>\n".
void serialProtocolSendSample(const PpgSample& sample);

#endif // SERIAL_PROTOCOL_H
