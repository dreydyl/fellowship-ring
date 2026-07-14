// serial_protocol.h
//
// Interface for the host communication protocol (over USB serial).
//
// This module is responsible ONLY for framing and transmitting data to
// the host application (web app) — it has no knowledge of how sensor
// samples are acquired (see ppg_sensor.h for that concern).
//
// TODO: Formalize the wire format (see docs/api.md) — e.g., a simple
// length-prefixed binary frame, or a text-based protocol (CSV/JSON
// lines). This header currently defines a minimal placeholder API.

#ifndef SERIAL_PROTOCOL_H
#define SERIAL_PROTOCOL_H

#include <stdint.h>
#include "ppg_sensor.h"

// Initializes the serial communication channel (e.g., Serial.begin()).
//
// TODO: Choose and document the baud rate / transport (USB CDC, UART).
void serialProtocolInit();

// Encodes and sends a single PPG sample to the host.
//
// TODO: Implement actual frame encoding once the wire format is defined.
void serialProtocolSendSample(const PpgSample& sample);

#endif // SERIAL_PROTOCOL_H
