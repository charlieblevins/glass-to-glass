import React, { useRef, useEffect, useState } from "react";

const TestVideoCreator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [latency, setLatency] = useState(0);

  const drawDigitalClock = (ctx: CanvasRenderingContext2D, time: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const timeString = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(
      time.getSeconds()
    )}`;

    ctx.font = "50px monospace";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeString, 0, 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const now = new Date();
      const delayedTime = new Date(now.getTime() - latency);

      // Clock 1
      ctx.save();
      ctx.translate(canvas.width / 4, canvas.height / 2);
      drawDigitalClock(ctx, now);
      ctx.restore();

      // Clock 2
      ctx.save();
      ctx.translate((canvas.width * 3) / 4, canvas.height / 2);
      drawDigitalClock(ctx, delayedTime);
      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [latency]);

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatency(parseInt(e.target.value, 10));
  };

  return (
    <div>
      <h1>Test Video Creator</h1>
      <div>
        <label>
          Latency (milliseconds):
          <input type="number" value={latency} onChange={handleLatencyChange} />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{ border: "1px solid black" }}
      ></canvas>
    </div>
  );
};

export default TestVideoCreator;
