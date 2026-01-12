import { ALL_FORMATS, BlobSource, CanvasSink, Input } from "mediabunny";

export default class ScreenRecording {
  private file: File;
  constructor(file: File) {
    this.file = file;
  }

  async firstFrameCanvas(): Promise<[HTMLCanvasElement | null, Error | null]> {
    // 1. Initialize the input source
    const input = new Input({
      source: new BlobSource(this.file),
      formats: ALL_FORMATS,
    });

    // 2. Mediabunny provides helper utilities for common tasks like thumbnails.
    // If using the standard 'extractThumbnail' helper:
    const track = await input.getPrimaryVideoTrack();
    if (!track) {
      // 6. Dispose of the input reader
      await input.dispose();
      return [null, new Error("no video track")];
    }

    const cs = new CanvasSink(track);
    const canvasGen = await cs.canvases();
    const next = await canvasGen.next();
    const wrappedCanvas = next.value;
    if (!wrappedCanvas) {
      await input.dispose();
      return [null, new Error("no video frames")];
    }
    const { canvas } = wrappedCanvas;

    // TODO: when is offscfeen canvas true?
    return [canvas as HTMLCanvasElement, null];
  }

  async frameCount(): Promise<number> {
    const input = new Input({
      source: new BlobSource(this.file),
      formats: ALL_FORMATS,
    });

    const track = await input.getPrimaryVideoTrack();
    if (!track) {
      input.dispose();
      throw new Error("no video track");
    }

    const stats = await track.computePacketStats();
    input.dispose();

    return stats.packetCount;
  }

  async *allFrames(): AsyncGenerator<{ canvas: HTMLCanvasElement; timestamp: number }, void, unknown> {
    const input = new Input({
      source: new BlobSource(this.file),
      formats: ALL_FORMATS,
    });

    const track = await input.getPrimaryVideoTrack();
    if (!track) {
      input.dispose();
      throw new Error("no video track");
    }

    const canvasSink = new CanvasSink(track);
    const canvasGenerator = canvasSink.canvases();

    try {
      for await (const wrappedCanvas of canvasGenerator) {
        yield {
          canvas: wrappedCanvas.canvas as HTMLCanvasElement,
          timestamp: wrappedCanvas.timestamp,
        };
      }
    } finally {
      input.dispose();
    }
  }
}
