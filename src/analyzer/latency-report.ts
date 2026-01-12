import type { Frame } from "../model/frame";

export interface LatencyReport {
  frames: Frame[];
  error: Error | null;
}
