import { Events } from "./model/events";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnalyzerStates } from "./analyzer/analyzer";
import type { LatencyReport } from "./analyzer/latency-report";
import { analyzerStore } from "./analyzer/analyzerStore";

function Report() {
  const navigate = useNavigate();
  const analyzer = analyzerStore.get();

  const [report, setReport] = useState<LatencyReport | null>();
  const [progress, setProgress] = useState<{ initializing: number; cropping: number; ocr: number }>({
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
          <div>Initializing OCR: {Math.round(progress.initializing * 100)}%</div>
          <div>Clock cropping: {Math.round(progress.cropping * 100)}%</div>
          <div>OCR: {Math.round(progress.ocr * 100)}%</div>
        </div>
      ) : (
        <div>
          {report.error ? (
            <div>Error: {report.error.message}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Frame #</th>
                  <th>Capture Clock</th>
                  <th>Capture OCR</th>
                  <th>Viewer Clock</th>
                  <th>Viewer OCR</th>
                </tr>
              </thead>
              <tbody>
                {report.frames.map((frame, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={frame.captureClockImageURL}
                        alt={`Capture clock frame ${index + 1}`}
                      />
                    </td>
                    <td>{frame.captureClockOCR}</td>
                    <td>
                      <img
                        src={frame.viewerClockImageURL}
                        alt={`Viewer clock frame ${index + 1}`}
                      />
                    </td>
                    <td>{frame.viewerClockOCR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Report;
