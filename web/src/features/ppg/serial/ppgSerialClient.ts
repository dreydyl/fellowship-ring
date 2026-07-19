// Web Serial connection + parsing for the PPG plotter feature.
//
// Wire format (see firmware/src/serial_protocol.h): plain-text CSV,
// one sample per line: "<timestampMs>,<rawValue>\n".
//
// This module is framework-agnostic (no React) so it can be unit
// tested and reused independently of the hook/UI layer.

export interface PpgSerialSample {
  timestampMs: number;
  rawValue: number;
}

const BAUD_RATE = 115200;

function parseLine(line: string): PpgSerialSample | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const commaIndex = trimmed.indexOf(',');
  if (commaIndex === -1) return null;

  const timestampMs = Number(trimmed.slice(0, commaIndex));
  const rawValue = Number(trimmed.slice(commaIndex + 1));

  if (!Number.isFinite(timestampMs) || !Number.isFinite(rawValue)) {
    return null;
  }

  return { timestampMs, rawValue };
}

export class PpgSerialClient {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private readLoopPromise: Promise<void> | null = null;
  private manualDisconnect = false;

  // Requests a serial port from the user and opens it at the PPG
  // firmware's baud rate. Must be called from a user gesture (e.g. a
  // click handler) per the Web Serial API's permission model.
  //
  // `onDisconnected` fires once the read loop stops for any reason
  // other than an explicit `disconnect()` call (e.g. a serial framing
  // error, buffer overrun, or the device being unplugged) so the UI
  // isn't left frozen on stale data without any indication.
  async connect(
    onSample: (sample: PpgSerialSample) => void,
    onDisconnected?: (error: Error) => void,
  ): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser.');
    }

    this.manualDisconnect = false;

    // Reuse a previously-granted port if one exists rather than always
    // showing the picker again. If the user has already paired the
    // device (e.g. from an earlier session), `requestPort()` can be
    // finicky about re-prompting for the same device, which made the
    // Connect button appear to do nothing.
    const existingPorts = await navigator.serial.getPorts();
    const port = existingPorts[0] ?? (await navigator.serial.requestPort());

    try {
      // Request a larger receive buffer than the default to reduce the
      // chance of overrun errors at high sample rates.
      await port.open({ baudRate: BAUD_RATE, bufferSize: 4096 });
    } catch (err) {
      throw new Error(
        `Failed to open serial port (it may still be held open by another tab, ` +
          `a running "pio device monitor", or the device needs to be unplugged ` +
          `and replugged): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    this.port = port;

    this.readLoopPromise = this.runReadLoop(port, onSample).catch((err: unknown) => {
      if (!this.manualDisconnect && onDisconnected) {
        onDisconnected(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private async runReadLoop(
    port: SerialPort,
    onSample: (sample: PpgSerialSample) => void,
  ): Promise<void> {
    if (!port.readable) {
      throw new Error('Serial port is not readable.');
    }

    const textStream = port.readable.pipeThrough(new TextDecoderStream());
    const reader = textStream.getReader();
    this.reader = reader;

    let buffer = '';

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          const sample = parseLine(line);
          if (sample) onSample(sample);
        }
      }
    } catch (err) {
      // Reader was cancelled (disconnect) or the device was unplugged.
      // Swallow cancellation errors; rethrow anything unexpected.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        throw err;
      }
    }
  }

  // Cancels the read loop and closes the port. Safe to call even if
  // never connected, or multiple times.
  async disconnect(): Promise<void> {
    this.manualDisconnect = true;

    if (this.reader) {
      await this.reader.cancel().catch(() => {});
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.readLoopPromise) {
      await this.readLoopPromise.catch(() => {});
      this.readLoopPromise = null;
    }

    if (this.port) {
      await this.port.close().catch(() => {});
      this.port = null;
    }
  }

  // Revokes the browser's permission for any previously-granted PPG
  // serial ports. Useful when a port keeps failing to open because of
  // a stale/broken pairing; the user can then re-pick the device fresh
  // via the Connect button.
  static async forgetAllPorts(): Promise<void> {
    if (!('serial' in navigator)) return;
    const ports = await navigator.serial.getPorts();
    await Promise.all(ports.map((port) => port.forget?.().catch(() => {})));
  }
}
