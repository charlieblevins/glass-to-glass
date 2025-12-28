import { events } from "./model/events"

function InputForm() {

  const computeLatency = () => {
    document.dispatchEvent(new CustomEvent(events.InputFormSubmitted))
  }

  return (
    <form id="input-form">
      <button type="submit" onClick={computeLatency}>Compute Latency</button>
    </form>
  )
}

export default InputForm
