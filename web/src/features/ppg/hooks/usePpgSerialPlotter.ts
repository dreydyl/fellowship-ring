// React hook wrapping PpgSerialClient for the PPG plotter feature.
//
// Incoming samples are buffered in a ring buffer held in a ref rather
// than React state, since the firmware streams at ~100Hz and routing
// every sample through a re-render would thrash the UI. Consumers
// (e.g. the canvas draw loop) should read `getSamples()` directly
// inside a requestAnimationFrame loop.

import { useCallback, useRef, useState } from 'react';
import { PpgSerialClient, type PpgSerialSample } from '../serial/ppgSerialClient';

export type PpgSerialStatus = 'idle' | 'connecting' | 'connected' | 'error';

const BUFFER_SIZE = 500; // ~5s at 100Hz

export function usePpgSerialPlotter() {
  const [status, setStatus] = useState<PpgSerialStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<PpgSerialClient | null>(null);
  const bufferRef = useRef<PpgSerialSample[]>([]);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');

    const client = new PpgSerialClient();
    clientRef.current = client;
    bufferRef.current = [];

    try {
      await client.connect(
        (sample) => {
          const buffer = bufferRef.current;
          buffer.push(sample);
          if (buffer.length > BUFFER_SIZE) {
            buffer.splice(0, buffer.length - BUFFER_SIZE);
          }
        },
        (disconnectError) => {
          // The read loop stopped unexpectedly (e.g. a serial framing
          // error or the device being unplugged) rather than via an
          // explicit disconnect() call. Surface it instead of leaving
          // the plot frozen with no indication anything went wrong.
          clientRef.current = null;
          setStatus('error');
          setError(disconnectError.message);
        },
      );
      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      clientRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    bufferRef.current = [];

    if (client) {
      await client.disconnect();
    }
    setStatus('idle');
  }, []);

  const forgetDevice = useCallback(async () => {
    await disconnect();
    await PpgSerialClient.forgetAllPorts();
  }, [disconnect]);

  const getSamples = useCallback((): readonly PpgSerialSample[] => {
    return bufferRef.current;
  }, []);

  return { status, error, connect, disconnect, forgetDevice, getSamples };
}
