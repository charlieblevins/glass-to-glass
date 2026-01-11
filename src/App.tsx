import { Routes, Route } from 'react-router-dom';
import InputForm from './inputForm.tsx';
import './App.css';
import Logo from './components/logo.tsx';
import Report from './report.tsx';
import TestVideoCreator from './pages/testVideoCreator.tsx';

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
  )
}

export default App
