import type { BoundBox } from "../model/boundBox";
import type { Frame } from "../model/frame";
import type { LatencyReport } from "./latency-report";
import type ScreenRecording from "./screen-recording";
import Tesseract from "tesseract.js";

export const AnalyzerStates = {
  Initial: 1,
  Running: 2,
  Finished: 3,
};

type State = (typeof AnalyzerStates)[keyof typeof AnalyzerStates];

export default class Analyzer {
  localState = AnalyzerStates.Initial;

  // Three-stage progress tracking
  private initializingProgress = 0;
  private croppingProgress = 0;
  private ocrProgress = 0;

  // inputs
  private screenRecording: ScreenRecording;
  private captureBox: BoundBox;
  private viewerBox: BoundBox;

  // output
  frames: Frame[] = [];

  constructor(
    screenRecording: ScreenRecording,
    captureBox: BoundBox,
    viewerBox: BoundBox
  ) {
    this.screenRecording = screenRecording;
    this.captureBox = captureBox;
    this.viewerBox = viewerBox;
  }

  async compute(): Promise<LatencyReport> {
    this.localState = AnalyzerStates.Running;

    console.log('[Analyzer] Starting compute...');
    const startTime = performance.now();

    // Create a scheduler with multiple workers for parallel processing
    const scheduler = Tesseract.createScheduler();
    const numWorkers = 4; // Adjust based on CPU cores

    console.log('[Analyzer] Initializing workers...');
    const initStart = performance.now();

    // Initialize workers with progress tracking
    const workers: Tesseract.Worker[] = [];
    for (let i = 0; i < numWorkers; i++) {
      const worker = await Tesseract.createWorker('eng');
      workers.push(worker);
      this.initializingProgress = (i + 1) / numWorkers;
    }

    workers.forEach(worker => scheduler.addWorker(worker));
    console.log(`[Analyzer] Workers initialized in ${(performance.now() - initStart).toFixed(0)}ms`);

    try {
      // extract frame count
      console.log('[Analyzer] Getting frame count...');
      const frameCount = await this.screenRecording.frameCount();
      console.log(`[Analyzer] Frame count: ${frameCount}`);

      // Collect all frame data first
      const frameData: Array<{
        captureClockImageURL: string;
        viewerClockImageURL: string;
        index: number;
      }> = [];

      console.log('[Analyzer] Starting frame extraction...');
      const extractStart = performance.now();

      let frameIndex = 0;
      for await (const canvas of this.screenRecording.allFrames()) {
        // Extract capture clock region
        const captureCanvas = this.extractRegion(canvas, this.captureBox);
        const captureClockImageURL = captureCanvas.toDataURL("image/png");

        // Extract viewer clock region
        const viewerCanvas = this.extractRegion(canvas, this.viewerBox);
        const viewerClockImageURL = viewerCanvas.toDataURL("image/png");

        frameData.push({
          captureClockImageURL,
          viewerClockImageURL,
          index: frameIndex,
        });

        frameIndex++;
        this.croppingProgress = frameIndex / frameCount;
      }

      console.log(`[Analyzer] Frame extraction completed in ${(performance.now() - extractStart).toFixed(0)}ms`);
      console.log('[Analyzer] Starting OCR processing...');
      const ocrStart = performance.now();

      // Process all frames in parallel using the scheduler
      let completedFrames = 0;
      const ocrPromises = frameData.map(async (data) => {
        // Process both clocks in parallel for this frame
        const [captureClockResult, viewerClockResult] = await Promise.all([
          scheduler.addJob('recognize', data.captureClockImageURL),
          scheduler.addJob('recognize', data.viewerClockImageURL),
        ]);

        const captureClockOCR = captureClockResult.data.text.trim();
        const viewerClockOCR = viewerClockResult.data.text.trim();

        // TODO: parse timestamps
        const captureClockParsed = new Date();
        const viewerClockParsed = new Date();

        // Update OCR progress (count completed frames)
        completedFrames++;
        this.ocrProgress = completedFrames / frameCount;

        return {
          captureClockImageURL: data.captureClockImageURL,
          captureClockOCR,
          captureClockParsed,
          viewerClockImageURL: data.viewerClockImageURL,
          viewerClockOCR,
          viewerClockParsed,
          index: data.index,
        };
      });

      // Wait for all OCR operations to complete
      const processedFrames = await Promise.all(ocrPromises);
      console.log(`[Analyzer] OCR processing completed in ${(performance.now() - ocrStart).toFixed(0)}ms`);

      console.log('[Analyzer] Sorting and mapping frames...');
      const sortStart = performance.now();

      // Sort frames by original index to maintain order
      processedFrames.sort((a, b) => a.index - b.index);

      // Add frames in order (remove index property)
      this.frames = processedFrames.map((item) => ({
        captureClockImageURL: item.captureClockImageURL,
        captureClockOCR: item.captureClockOCR,
        captureClockParsed: item.captureClockParsed,
        viewerClockImageURL: item.viewerClockImageURL,
        viewerClockOCR: item.viewerClockOCR,
        viewerClockParsed: item.viewerClockParsed,
      }));

      console.log(`[Analyzer] Sorting completed in ${(performance.now() - sortStart).toFixed(0)}ms`);
      console.log(`[Analyzer] Total compute time: ${(performance.now() - startTime).toFixed(0)}ms`);

      this.localState = AnalyzerStates.Finished;
      this.initializingProgress = 1;
      this.croppingProgress = 1;
      this.ocrProgress = 1;

      return {
        frames: this.frames,
        error: null,
      };
    } finally {
      // Clean up all workers
      await scheduler.terminate();
    }
  }

  state(): State {
    return this.localState;
  }

  progress(): { initializing: number; cropping: number; ocr: number } {
    return {
      initializing: this.initializingProgress,
      cropping: this.croppingProgress,
      ocr: this.ocrProgress,
    };
  }

  private extractRegion(canvas: HTMLCanvasElement, box: BoundBox): HTMLCanvasElement {
    const regionCanvas = document.createElement("canvas");
    regionCanvas.width = box.width;
    regionCanvas.height = box.height;

    const ctx = regionCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context for region extraction");
    }

    // Draw the specified region from the source canvas onto the new canvas
    ctx.drawImage(
      canvas,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height
    );

    return regionCanvas;
  }
}
