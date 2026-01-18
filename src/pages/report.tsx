import { Events } from "../model/events";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnalyzerStates } from "../analyzer/analyzer";
import type { LatencyReport } from "../analyzer/latency-report";
import { analyzerStore } from "../analyzer/analyzerStore";

function Report() {
  const navigate = useNavigate();
  const analyzer = analyzerStore.get();

  const [report, setReport] = useState<LatencyReport | null>();
  const [progress, setProgress] = useState<{
    initializing: number;
    cropping: number;
    ocr: number;
  }>({
    initializing: 0,
    cropping: 0,
    ocr: 0,
  });

  const back = () => {
    document.dispatchEvent(new CustomEvent(Events.BackToForm));
  };

  useEffect(() => {
    async function run() {
      if (!analyzer) {
        console.warn("report page had no analyzer. redirecting home.");
        navigate("/");
        return;
      }

      if (analyzer.state() !== AnalyzerStates.Initial) {
        return;
      }

      // Poll progress every 500ms
      const progressInterval = setInterval(() => {
        setProgress(analyzer.progress());
      }, 500);

      const report = await analyzer.compute();

      clearInterval(progressInterval);
      setProgress({ initializing: 1, cropping: 1, ocr: 1 });
      setReport(report);
    }

    run();
  }, [analyzer, navigate]);

  if (!analyzer) {
    return <div>Redirecting...</div>;
  }

  return (
    <div>
      <button onClick={back}>back</button>
      <h1>Report</h1>
      {!report ? (
        <div>
          <div>Computing latency analysis&hellip;</div>
          <div>
            Initializing OCR: {Math.round(progress.initializing * 100)}%
          </div>
          <div>Clock cropping: {Math.round(progress.cropping * 100)}%</div>
          <div>OCR: {Math.round(progress.ocr * 100)}%</div>
        </div>
      ) : (
        <div>
          {report.error ? (
            <div>Error: {report.error.message}</div>
          ) : (
            <>
              {(() => {
                const latencies = report.frames
                  .map((frame) => {
                    const captureValid = !isNaN(
                      frame.captureClockParsed.getTime()
                    );
                    const viewerValid = !isNaN(
                      frame.viewerClockParsed.getTime()
                    );
                    return captureValid && viewerValid
                      ? frame.viewerClockParsed.getTime() -
                          frame.captureClockParsed.getTime()
                      : null;
                  })
                  .filter((latency): latency is number => latency !== null);

                const avgLatency = (() => {
                  if (latencies.length === 0) return null;

                  // Sort latencies to remove outliers
                  const sorted = [...latencies].sort((a, b) => a - b);

                  // Remove top and bottom 1%
                  const trimAmount = Math.floor(sorted.length * 0.05);
                  const trimmed = sorted.slice(trimAmount, sorted.length - trimAmount);

                  // If we trimmed everything, fall back to original
                  if (trimmed.length === 0) {
                    return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
                  }

                  return trimmed.reduce((sum, lat) => sum + lat, 0) / trimmed.length;
                })();

                return avgLatency !== null ? (
                  <div
                    style={{
                      marginBottom: "20px",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    Average Latency: {avgLatency.toFixed(2)} ms
                  </div>
                ) : null;
              })()}
              <table>
                <thead>
                  <tr>
                    <th>Frame #</th>
                    <th>Offset (s)</th>
                    <th>Capture Clock</th>
                    <th>Capture OCR</th>
                    <th>Capture Parsed</th>
                    <th>Viewer Clock</th>
                    <th>Viewer OCR</th>
                    <th>Viewer Parsed</th>
                    <th>Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.frames.map((frame, index) => {
                    const captureValid = !isNaN(
                      frame.captureClockParsed.getTime()
                    );
                    const viewerValid = !isNaN(
                      frame.viewerClockParsed.getTime()
                    );
                    const latency =
                      captureValid && viewerValid
                        ? frame.viewerClockParsed.getTime() -
                          frame.captureClockParsed.getTime()
                        : null;

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{frame.screenRecordingOffsetSeconds.toFixed(3)}</td>
                        <td>
                          <img
                            src={frame.captureClockImageURL}
                            alt={`Capture clock frame ${index + 1}`}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>{frame.captureClockOCR}</td>
                        <td>
                          {captureValid
                            ? frame.captureClockParsed.toLocaleTimeString(
                                "en-US",
                                {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  fractionalSecondDigits: 3,
                                }
                              )
                            : "Skipped"}
                        </td>
                        <td>
                          <img
                            src={frame.viewerClockImageURL}
                            alt={`Viewer clock frame ${index + 1}`}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>{frame.viewerClockOCR}</td>
                        <td>
                          {viewerValid
                            ? frame.viewerClockParsed.toLocaleTimeString(
                                "en-US",
                                {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  fractionalSecondDigits: 3,
                                }
                              )
                            : "Skipped"}
                        </td>
                        <td>{latency !== null ? latency.toFixed(0) : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Report;
