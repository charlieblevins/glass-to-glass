import type { BoundBox } from "../model/boundBox";
import type { Frame } from "../model/frame";
import type { LatencyReport } from "./latency-report";
import type ScreenRecording from "./screen-recording";
import Tesseract from "tesseract.js";
import TimestampParser, { type TimestampData } from "./timestamp-parser";

export const AnalyzerStates = {
  Initial: 1,
  Running: 2,
  Finished: 3,
};

type State = (typeof AnalyzerStates)[keyof typeof AnalyzerStates];

interface FrameExtractionData {
  captureClockImageURL: string;
  viewerClockImageURL: string;
  index: number;
  timestamp: number;
}

interface ProcessedFrameData extends TimestampData {
  captureClockImageURL: string;
  captureClockOCR: string;
  captureClockParsed: Date;
  viewerClockImageURL: string;
  viewerClockOCR: string;
  viewerClockParsed: Date;
  index: number;
}

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

  // helpers
  private timestampParser = new TimestampParser();

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
    const startTime = performance.now();

    const scheduler = await this.initializeWorkerPool(4);

    try {
      const frameCount = await this.screenRecording.frameCount();
      const frameData = await this.extractFrameData(frameCount);
      const processedFrames = await this.processFramesWithOCR(
        frameData,
        scheduler,
        frameCount
      );
      this.frames = this.finalizeFrames(processedFrames);

      this.markComplete(startTime);

      return {
        frames: this.frames,
        error: null,
      };
    } finally {
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

  private markComplete(startTime: number): void {
    console.log(
      `[Analyzer] Total compute time: ${(performance.now() - startTime).toFixed(0)}ms`
    );
    this.localState = AnalyzerStates.Finished;
    this.initializingProgress = 1;
    this.croppingProgress = 1;
    this.ocrProgress = 1;
  }

  private async initializeWorkerPool(
    numWorkers: number
  ): Promise<Tesseract.Scheduler> {
    console.log("[Analyzer] Initializing workers...");
    const initStart = performance.now();

    const scheduler = Tesseract.createScheduler();
    const workers: Tesseract.Worker[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const worker = await Tesseract.createWorker("eng");
      workers.push(worker);
      this.initializingProgress = (i + 1) / numWorkers;
    }

    workers.forEach((worker) => scheduler.addWorker(worker));
    console.log(
      `[Analyzer] Workers initialized in ${(performance.now() - initStart).toFixed(0)}ms`
    );

    return scheduler;
  }

  private async extractFrameData(
    frameCount: number
  ): Promise<FrameExtractionData[]> {
    console.log("[Analyzer] Getting frame count...");
    console.log(`[Analyzer] Frame count: ${frameCount}`);

    const frameData: FrameExtractionData[] = [];

    console.log("[Analyzer] Starting frame extraction...");
    const extractStart = performance.now();

    let frameIndex = 0;
    for await (const {
      canvas,
      timestamp,
    } of this.screenRecording.allFrames()) {
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
        timestamp,
      });

      frameIndex++;
      this.croppingProgress = frameIndex / frameCount;
    }

    console.log(
      `[Analyzer] Frame extraction completed in ${(performance.now() - extractStart).toFixed(0)}ms`
    );

    return frameData;
  }

  private async processFramesWithOCR(
    frameData: FrameExtractionData[],
    scheduler: Tesseract.Scheduler,
    frameCount: number
  ): Promise<ProcessedFrameData[]> {
    console.log("[Analyzer] Starting OCR processing...");
    const ocrStart = performance.now();

    let completedFrames = 0;
    const ocrPromises = frameData.map(async (data) => {
      // Process both clocks in parallel for this frame
      const [captureClockResult, viewerClockResult] = await Promise.all([
        scheduler.addJob("recognize", data.captureClockImageURL),
        scheduler.addJob("recognize", data.viewerClockImageURL),
      ]);

      const captureClockOCR = captureClockResult.data.text.trim();
      const viewerClockOCR = viewerClockResult.data.text.trim();

      // Parse timestamps from OCR text
      const captureClockParsed = this.timestampParser.parse(captureClockOCR);
      const viewerClockParsed = this.timestampParser.parse(viewerClockOCR);

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
        timestamp: data.timestamp,
      };
    });

    // Wait for all OCR operations to complete
    const processedFrames = await Promise.all(ocrPromises);
    console.log(
      `[Analyzer] OCR processing completed in ${(performance.now() - ocrStart).toFixed(0)}ms`
    );

    return processedFrames;
  }

  private finalizeFrames(processedFrames: ProcessedFrameData[]): Frame[] {
    console.log("[Analyzer] Sorting and mapping frames...");
    const sortStart = performance.now();

    // Sort frames by original index to maintain order
    processedFrames.sort((a, b) => a.index - b.index);

    // Interpolate milliseconds for capture and viewer clocks
    this.timestampParser.interpolateMilliseconds(processedFrames, "captureClockParsed");
    this.timestampParser.interpolateMilliseconds(processedFrames, "viewerClockParsed");

    // Add frames in order (remove index property)
    const frames = processedFrames.map((item) => ({
      screenRecordingOffsetSeconds: item.timestamp,
      captureClockImageURL: item.captureClockImageURL,
      captureClockOCR: item.captureClockOCR,
      captureClockParsed: item.captureClockParsed,
      viewerClockImageURL: item.viewerClockImageURL,
      viewerClockOCR: item.viewerClockOCR,
      viewerClockParsed: item.viewerClockParsed,
    }));

    console.log(
      `[Analyzer] Sorting completed in ${(performance.now() - sortStart).toFixed(0)}ms`
    );

    return frames;
  }

  // returns a canvas containing only the content within box
  private extractRegion(
    canvas: HTMLCanvasElement,
    box: BoundBox
  ): HTMLCanvasElement {
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
