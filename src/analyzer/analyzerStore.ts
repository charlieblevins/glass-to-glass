import type Analyzer from "./analyzer";

// Simple module-level store for the current analyzer
let currentAnalyzer: Analyzer | null = null;

export const analyzerStore = {
  set(analyzer: Analyzer) {
    currentAnalyzer = analyzer;
  },
  get(): Analyzer | null {
    return currentAnalyzer;
  },
  clear() {
    currentAnalyzer = null;
  },
};
