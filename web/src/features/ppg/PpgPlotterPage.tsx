// Live PPG serial plotter page.
//
// Connects to the device over the Web Serial API and renders the
// incoming waveform on a <canvas> using a requestAnimationFrame draw
// loop. Samples are read directly from the ring buffer each frame to
// avoid routing every sample through React state.

import { useEffect, useRef } from 'react';
import { usePpgSerialPlotter } from './hooks/usePpgSerialPlotter';

export function PpgPlotterPage() {
  const { status, error, connect, disconnect, forgetDevice, getSamples } = usePpgSerialPlotter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveValueRef = useRef<HTMLSpanElement | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const resizeCanvas = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const AXIS_HEIGHT = 20;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const plotHeight = height - AXIS_HEIGHT;

      ctx.clearRect(0, 0, width, height);

      const samples = getSamples();
      if (samples.length > 1) {
        let min = Infinity;
        let max = -Infinity;
        for (const sample of samples) {
          if (sample.rawValue < min) min = sample.rawValue;
          if (sample.rawValue > max) max = sample.rawValue;
        }
        const range = max - min || 1;

        const firstTimestamp = samples[0].timestampMs;
        const lastTimestamp = samples[samples.length - 1].timestampMs;
        const timeSpan = lastTimestamp - firstTimestamp || 1;

        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.beginPath();

        samples.forEach((sample, index) => {
          const x = ((sample.timestampMs - firstTimestamp) / timeSpan) * width;
          const y = plotHeight - ((sample.rawValue - min) / range) * plotHeight;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Timeline: draw a baseline and second-interval tick labels
        // showing elapsed time (relative to the oldest sample in view).
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, plotHeight + 0.5);
        ctx.lineTo(width, plotHeight + 0.5);
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const spanSeconds = timeSpan / 1000;
        const tickIntervalSeconds = spanSeconds > 5 ? 1 : 0.5;
        for (let t = 0; t <= spanSeconds; t += tickIntervalSeconds) {
          const x = (t * 1000 / timeSpan) * width;
          ctx.beginPath();
          ctx.moveTo(x, plotHeight);
          ctx.lineTo(x, plotHeight + 4);
          ctx.stroke();
          ctx.fillText(`-${(spanSeconds - t).toFixed(1)}s`, x, plotHeight + 6);
        }

        const liveValueEl = liveValueRef.current;
        if (liveValueEl) {
          liveValueEl.textContent = String(samples[samples.length - 1].rawValue);
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [getSamples]);

  if (!isSupported) {
    return (
      <div>
        <h1>PPG Plotter</h1>
        <p>
          Web Serial API is not supported in this browser. Please use a
          Chromium-based browser (Chrome or Edge) over HTTPS or localhost.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>PPG Plotter</h1>

      <p>Status: {status}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <p>
        Live value: <span ref={liveValueRef} style={{ fontWeight: 'bold', fontSize: '1.25em' }}>—</span>
      </p>

      {status === 'connected' ? (
        <button onClick={() => void disconnect()}>Disconnect</button>
      ) : (
        <button onClick={() => void connect()} disabled={status === 'connecting'}>
          Connect
        </button>
      )}{' '}
      <button onClick={() => void forgetDevice()} disabled={status === 'connecting'}>
        Forget device
      </button>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}
      />
    </div>
  );
}
