import type { BoundBox } from "../model/boundBox";
import type { Frame } from "../model/frame";
import type { LatencyReport } from "./latency-report";
import type ScreenRecording from "./screen-recording";

export const AnalyzerStates = {
  Initial: 1,
  Running: 2,
  Finished: 3,
};

type State = (typeof AnalyzerStates)[keyof typeof AnalyzerStates];

export default class Analyzer {
  localState = AnalyzerStates.Running;
  // the percentage of progress for this analysis.
  // a number between 0 and 1;
  localProgress = 0;

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
    // extract frame count
    const frameCount = await this.screenRecording.frameCount();
    // loop over every frame in the user's video
    let frameIndex = 0;

    for await (const canvas of this.screenRecording.allFrames()) {
      // Extract capture clock region
      const captureCanvas = this.extractRegion(canvas, this.captureBox);
      const captureClockImageURL = captureCanvas.toDataURL("image/png");

      // Extract viewer clock region
      const viewerCanvas = this.extractRegion(canvas, this.viewerBox);
      const viewerClockImageURL = viewerCanvas.toDataURL("image/png");

      // TODO: perform OCR on both regions
      const captureClockOCR = "";
      const viewerClockOCR = "";

      // TODO: parse timestamps
      const captureClockParsed = new Date();
      const viewerClockParsed = new Date();

      // Create Frame object and add to this.frames
      const frame: Frame = {
        captureClockImageURL,
        captureClockOCR,
        captureClockParsed,
        viewerClockImageURL,
        viewerClockOCR,
        viewerClockParsed,
      };

      this.frames.push(frame);

      // Update progress
      frameIndex++;
      this.localProgress = frameIndex / frameCount;
    }

    this.localState = AnalyzerStates.Finished;
    this.localProgress = 1;

    return {
      frames: this.frames,
      error: null,
    };
  }

  state(): State {
    return this.localState;
  }

  progress(): number {
    return this.localProgress;
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
