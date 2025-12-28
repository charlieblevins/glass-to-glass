import { Events } from "./model/events"

function Report() {

  const back = () => {
    document.dispatchEvent(new CustomEvent(Events.BackToForm))
  }


  return (
    <div>
      <button onClick={back}>back</button>
      <h1>Report</h1>
    </div>
  )
}

export default Report
