import { Events } from "./model/events";
import { useLocation } from "react-router-dom";
import type Analyzer from "./analyzer/analyzer";
import { useEffect } from "react";
import { AnalyzerStates } from "./analyzer/analyzer";

function Report() {
  const location = useLocation();
  const { analyzer } = location.state as { analyzer: Analyzer };

  const back = () => {
    document.dispatchEvent(new CustomEvent(Events.BackToForm));
  };

  useEffect(() => {
    async function run() {
      await analyzer.compute();
    }

    if (analyzer.state() === AnalyzerStates.Initial) {
      run();
    }
  }, [analyzer]);

  return (
    <div>
      <button onClick={back}>back</button>
      <h1>Report</h1>
    </div>
  );
}

export default Report;
