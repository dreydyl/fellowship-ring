// Minimal ambient types for the Web Serial API.
//
// The TypeScript DOM lib does not yet ship types for `navigator.serial`,
// so we declare just enough of the surface used by the `ppg` feature.
// See: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;

  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  forget(): Promise<void>;
  getInfo(): SerialPortInfo;
}

interface SerialPortRequestOptions {
  filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  readonly serial: Serial;
}
