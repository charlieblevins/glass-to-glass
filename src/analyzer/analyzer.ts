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
      // TODO: process each frame canvas
      // - extract capture clock region using this.captureBox
      // - extract viewer clock region using this.viewerBox
      // - perform OCR on both regions
      // - parse timestamps
      // - create Frame object and add to this.frames

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
}
