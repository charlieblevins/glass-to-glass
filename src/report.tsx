import { Events } from "./model/events";
import { useLocation, useNavigate } from "react-router-dom";
import Analyzer from "./analyzer/analyzer";
import { useEffect, useState } from "react";
import { AnalyzerStates } from "./analyzer/analyzer";
import type { LatencyReport } from "./analyzer/latency-report";

function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const analyzer = location.state?.analyzer as Analyzer | undefined;

  const [report, setReport] = useState<LatencyReport | null>();
  const [progress, setProgress] = useState<number>(0);

  const back = () => {
    document.dispatchEvent(new CustomEvent(Events.BackToForm));
  };

  useEffect(() => {
    async function run() {
      if (!(analyzer instanceof Analyzer)) {
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

      const r = await (analyzer as Analyzer).compute();

      clearInterval(progressInterval);
      setProgress(1);
      setReport(r);
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
          <div>Progress: {Math.round(progress * 100)}%</div>
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
