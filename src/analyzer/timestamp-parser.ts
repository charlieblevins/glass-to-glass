export interface TimestampData {
  timestamp: number;
  [key: string]: Date | number | string;
}

export default class TimestampParser {
  /**
   * Parse OCR text into a Date object, attempting multiple timestamp formats
   */
  parse(ocrText: string): Date {
    // Clean up OCR text - remove common OCR artifacts
    const cleaned = ocrText
      .trim()
      .replace(/[|]/g, ":") // Common OCR mistake: | instead of :
      .replace(/[O]/g, "0") // Common OCR mistake: O instead of 0
      .replace(/[lI]/g, "1") // Common OCR mistake: l or I instead of 1
      .replace(/\s+/g, " "); // Normalize whitespace

    // Try various timestamp formats
    // Format 1: "HH:MM:SS.mmm" or "HH:MM:SS" (24-hour time)
    const time24Match = cleaned.match(
      /(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/
    );
    if (time24Match) {
      const [, hours, minutes, seconds, milliseconds = "0"] = time24Match;
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10));
      date.setMilliseconds(parseInt(milliseconds.padEnd(3, "0"), 10));
      return date;
    }

    // Format 2: "HH:MM:SS AM/PM" (12-hour time)
    const time12Match = cleaned.match(
      /(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*(AM|PM)/i
    );
    if (time12Match) {
      const [, hours, minutes, seconds, milliseconds = "0", period] =
        time12Match;
      let hrs = parseInt(hours, 10);
      if (period.toUpperCase() === "PM" && hrs !== 12) {
        hrs += 12;
      } else if (period.toUpperCase() === "AM" && hrs === 12) {
        hrs = 0;
      }
      const date = new Date();
      date.setHours(hrs);
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10));
      date.setMilliseconds(parseInt(milliseconds.padEnd(3, "0"), 10));
      return date;
    }

    // Format 3: ISO format or other standard formats
    const isoDate = new Date(cleaned);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // If all parsing fails, return an invalid date
    console.warn(
      `Failed to parse timestamp: "${ocrText}" (cleaned: "${cleaned}")`
    );
    return new Date(NaN);
  }

  /**
   * Set milliseconds on each of the dates using the deltas from
   * the screen-recording's playback time offset.
   */
  interpolateMilliseconds<T extends TimestampData>(
    frames: T[],
    dateField: keyof T
  ): void {
    let baselineOffsetSeconds: number | null = null;
    let lastValidSeconds: number | null = null;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const currentDate = frame[dateField] as Date;

      // Skip invalid dates
      if (isNaN(currentDate.getTime())) {
        continue;
      }

      const currentSeconds =
        currentDate.getHours() * 3600 +
        currentDate.getMinutes() * 60 +
        currentDate.getSeconds();

      // Check if the second value has increased
      if (lastValidSeconds !== null && currentSeconds > lastValidSeconds) {
        // Second has changed - set this as the new baseline
        baselineOffsetSeconds = frame.timestamp;
        currentDate.setMilliseconds(0);
        lastValidSeconds = currentSeconds;
      } else if (
        baselineOffsetSeconds !== null &&
        currentSeconds === lastValidSeconds
      ) {
        // We have a baseline and the second hasn't changed - interpolate milliseconds
        const offsetDiff = frame.timestamp - baselineOffsetSeconds;
        const milliseconds = Math.round((offsetDiff % 1) * 1000);
        currentDate.setMilliseconds(milliseconds);
      } else {
        // No baseline yet - mark for skipping by setting to invalid
        (frame[dateField] as Date) = new Date(NaN);
        lastValidSeconds = currentSeconds;
      }
    }
  }
}
