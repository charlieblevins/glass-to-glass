export interface Frame {
  screenRecordingOffsetSeconds: number;
  captureClockImageURL: string;
  captureClockOCR: string;
  captureClockParsed: Date;
  viewerClockImageURL: string;
  viewerClockOCR: string;
  viewerClockParsed: Date;
}
