import { Events } from "./model/events"

function InputForm() {

  const computeLatency = () => {
    document.dispatchEvent(new CustomEvent(Events.InputFormSubmitted))
  }

  return (
    <form id="input-form">
      <div id="video-input" className="input-group">
        <input type="file" />
      </div>
      <div id="capture-clock-input" className="input-group"></div>
      <div id="now-clock-input" className="input-group"></div>
      <button type="submit" onClick={computeLatency}>Compute Latency</button>
    </form>
  )
}

export default InputForm
