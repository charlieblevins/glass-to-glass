import { useEffect, useState } from 'react'
import InputForm from './inputForm.tsx';
import './App.css'
import { events } from './model/events.ts';
import Logo from './components/logo.tsx';
import Report from './report.tsx';


function App() {
  const [stateMachine, setStateMachine] = useState(0)

  useEffect(() => {
    document.addEventListener(events.InputFormSubmitted, () => {
      setStateMachine(1);
    })
  }, [])

  return (
    <>
      <header>
        <div id="headline-text">Glass to Glass</div>
        <Logo /> 
      </header>
      {stateMachine === 0 ? (
        <InputForm />
      ) : (
        <Report />
      )}
    </>
  )
}

export default App