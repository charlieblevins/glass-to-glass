import Analyzer from "./analyzer";
import type ScreenRecording from "./screen-recording";

export default class AnalyzerBuilder {
  private screenRecording: ScreenRecording | null = null;

  build(): [Analyzer | null, Error | null] {
    if (!this.screenRecording) {
      return [null, new Error("missing screen recording")];
    }
    return [new Analyzer(), null];
  }

  addScreenRecording(sr: ScreenRecording) {
    this.screenRecording = sr;
  }
}
