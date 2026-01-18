import { Routes, Route } from "react-router-dom";
import Logo from "./components/logo.tsx";

// Pages
import InputForm from "./pages/inputForm.tsx";
import Report from "./pages/report.tsx";
import TestVideoCreator from "./pages/testVideoCreator.tsx";

// CSS
import "./App.css";

function App() {
  return (
    <>
      <header>
        <Logo />
        <div id="headline-text">Glass to Glass</div>
      </header>
      <Routes>
        <Route path="/" element={<InputForm />} />
        <Route path="/report" element={<Report />} />
        <Route path="/test-video-create" element={<TestVideoCreator />} />
      </Routes>
    </>
  );
}

export default App;
