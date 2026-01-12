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
        timestamp: number;
      }> = [];

      console.log('[Analyzer] Starting frame extraction...');
      const extractStart = performance.now();

      let frameIndex = 0;
      for await (const { canvas, timestamp } of this.screenRecording.allFrames()) {
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

        // Parse timestamps from OCR text
        const captureClockParsed = this.parseTimestamp(captureClockOCR);
        const viewerClockParsed = this.parseTimestamp(viewerClockOCR);

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
      console.log(`[Analyzer] OCR processing completed in ${(performance.now() - ocrStart).toFixed(0)}ms`);

      console.log('[Analyzer] Sorting and mapping frames...');
      const sortStart = performance.now();

      // Sort frames by original index to maintain order
      processedFrames.sort((a, b) => a.index - b.index);

      // Interpolate milliseconds for capture and viewer clocks
      this.interpolateMilliseconds(processedFrames, 'captureClockParsed');
      this.interpolateMilliseconds(processedFrames, 'viewerClockParsed');

      // Add frames in order (remove index property)
      this.frames = processedFrames.map((item) => ({
        screenRecordingOffsetSeconds: item.timestamp,
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

  private parseTimestamp(ocrText: string): Date {
    // Clean up OCR text - remove common OCR artifacts
    const cleaned = ocrText
      .trim()
      .replace(/[|]/g, ':') // Common OCR mistake: | instead of :
      .replace(/[O]/g, '0') // Common OCR mistake: O instead of 0
      .replace(/[lI]/g, '1') // Common OCR mistake: l or I instead of 1
      .replace(/\s+/g, ' '); // Normalize whitespace

    // Try various timestamp formats
    // Format 1: "HH:MM:SS.mmm" or "HH:MM:SS" (24-hour time)
    const time24Match = cleaned.match(/(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
    if (time24Match) {
      const [, hours, minutes, seconds, milliseconds = '0'] = time24Match;
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10));
      date.setMilliseconds(parseInt(milliseconds.padEnd(3, '0'), 10));
      return date;
    }

    // Format 2: "HH:MM:SS AM/PM" (12-hour time)
    const time12Match = cleaned.match(/(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*(AM|PM)/i);
    if (time12Match) {
      const [, hours, minutes, seconds, milliseconds = '0', period] = time12Match;
      let hrs = parseInt(hours, 10);
      if (period.toUpperCase() === 'PM' && hrs !== 12) {
        hrs += 12;
      } else if (period.toUpperCase() === 'AM' && hrs === 12) {
        hrs = 0;
      }
      const date = new Date();
      date.setHours(hrs);
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10));
      date.setMilliseconds(parseInt(milliseconds.padEnd(3, '0'), 10));
      return date;
    }

    // Format 3: ISO format or other standard formats
    const isoDate = new Date(cleaned);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // If all parsing fails, return an invalid date
    console.warn(`Failed to parse timestamp: "${ocrText}" (cleaned: "${cleaned}")`);
    return new Date(NaN);
  }

  private interpolateMilliseconds(
    frames: Array<{
      timestamp: number;
      captureClockParsed: Date;
      viewerClockParsed: Date;
      captureClockImageURL: string;
      captureClockOCR: string;
      viewerClockImageURL: string;
      viewerClockOCR: string;
      index: number;
    }>,
    dateField: 'captureClockParsed' | 'viewerClockParsed'
  ): void {
    let baselineOffsetSeconds: number | null = null;
    let lastValidSeconds: number | null = null;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const currentDate = frame[dateField];

      // Skip invalid dates
      if (isNaN(currentDate.getTime())) {
        continue;
      }

      const currentSeconds = currentDate.getHours() * 3600 + currentDate.getMinutes() * 60 + currentDate.getSeconds();

      // Check if the second value has increased
      if (lastValidSeconds !== null && currentSeconds > lastValidSeconds) {
        // Second has changed - set this as the new baseline
        baselineOffsetSeconds = frame.timestamp;
        currentDate.setMilliseconds(0);
        lastValidSeconds = currentSeconds;
      } else if (baselineOffsetSeconds !== null && currentSeconds === lastValidSeconds) {
        // We have a baseline and the second hasn't changed - interpolate milliseconds
        const offsetDiff = frame.timestamp - baselineOffsetSeconds;
        const milliseconds = Math.round((offsetDiff % 1) * 1000);
        currentDate.setMilliseconds(milliseconds);
      } else {
        // No baseline yet - mark for skipping by setting to invalid
        frame[dateField] = new Date(NaN);
        lastValidSeconds = currentSeconds;
      }
    }
  }
}
