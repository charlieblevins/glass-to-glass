import React, { useRef, useEffect, useState } from "react";
import {
  Output,
  CanvasSource,
  Mp4OutputFormat,
  BufferTarget,
  QUALITY_HIGH,
} from "mediabunny";

const TestVideoCreator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
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

  const handleStartRecording = async () => {
    setIsRecording(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsRecording(false);
      return;
    }

    const duration = 10 * 1000; // 10 seconds
    const frameRate = 30;

    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    });

    const canvasSource = new CanvasSource(canvas, {
      codec: "avc",
      bitrate: QUALITY_HIGH,
    });
    output.addVideoTrack(canvasSource, { frameRate });
    await output.start();
    const frameInterval = 1000 / frameRate;
    const totalFrames = duration / frameInterval;

    for (let i = 0; i < totalFrames; i++) {
      await canvasSource.add((i * frameInterval) / 1000); // Convert milliseconds to seconds
      await new Promise((resolve) => setTimeout(resolve, frameInterval));
    }

    await output.finalize();

    const videoBuffer = await output.target.buffer;

    if (videoBuffer === null) {
      console.error("Video buffer is null, unable to create video blob.");
      setIsRecording(false);
      return;
    }

    const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    const reader = new FileReader();
    reader.readAsDataURL(videoBlob);

    setIsRecording(false);
  };

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
      <div>
        <button onClick={handleStartRecording} disabled={isRecording}>
          {isRecording ? "Recording..." : "Start 10s Recording"}
        </button>
      </div>
      {videoUrl && (
        <div>
          <h2>Generated Video:</h2>
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            style={{ width: "800px" }}
          ></video>
          <div>
            <a href={videoUrl} download="canvas-animation.webm">
              Download Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestVideoCreator;
