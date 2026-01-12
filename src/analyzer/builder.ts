import type { BoundBox } from "../model/boundBox";
import Analyzer from "./analyzer";
import type ScreenRecording from "./screen-recording";

export default class AnalyzerBuilder {
  private screenRecording: ScreenRecording | null = null;
  private captureBox: BoundBox | null = null;
  private viewerBox: BoundBox | null = null;

  build(): [Analyzer | null, Error | null] {
    if (!this.screenRecording) {
      return [null, new Error("missing screen recording")];
    }
    if (!this.captureBox) {
      return [null, new Error("missing capture clock box")];
    }
    if (!this.viewerBox) {
      return [null, new Error("missing viewer clock box")];
    }
    return [
      new Analyzer(this.screenRecording, this.captureBox, this.viewerBox),
      null,
    ];
  }

  addScreenRecording(sr: ScreenRecording) {
    this.screenRecording = sr;
  }

  setCaptureBox(bb: BoundBox) {
    this.captureBox = bb;
  }

  setViewerBox(bb: BoundBox) {
    this.viewerBox = bb;
  }

  getCaptureBox(): BoundBox | null {
    return this.captureBox;
  }

  getViewerBox(): BoundBox | null {
    return this.viewerBox;
  }
}
