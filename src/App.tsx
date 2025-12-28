import { useEffect, useState } from 'react'
import InputForm from './inputForm.tsx';
import './App.css'
import { Events } from './model/events.ts';
import Logo from './components/logo.tsx';
import Report from './report.tsx';
import { States } from './model/stateMachine.ts';


function App() {
  const [stateMachine, setStateMachine] = useState(States.Input)

  useEffect(() => {
    document.addEventListener(Events.InputFormSubmitted, () => {
      setStateMachine(States.Output);
    })
    document.addEventListener(Events.BackToForm, () => {
      setStateMachine(States.Input);
    })
  }, [])

  return (
    <>
      <header>
        <Logo /> 
        <div id="headline-text">Glass to Glass</div>
      </header>
      {stateMachine === States.Input ? (
        <InputForm />
      ) : (
        <Report />
      )}
    </>
  )
}

export default App