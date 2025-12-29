import { Events } from "./model/events";
import { States } from "./model/stateMachine";
import BoundBoxFields from "./components/boundBoxFields";
import { useRef } from "react";
import BoundBoxEditor from "./components/boundBoxEditor";

function InputForm({ stateMachine }: { stateMachine: number }) {
  const dialog = useRef<HTMLDialogElement>(null)

  const computeLatency = () => {
    document.dispatchEvent(new CustomEvent(Events.InputFormSubmitted));
  };

  const onVideoInputChange = () => {
    document.dispatchEvent(new CustomEvent(Events.VideoAdded));
  };

  return (
    <form id="input-form">
      <div id="video-input" className="input-group">
        <label className="required-label">Screen Recording</label>
        <div>
          <input onChange={onVideoInputChange} type="file" required />
        </div>
      </div>
      <div id="capture-clock-box-input" className="input-group">
        <div className="label">Capture Clock Position</div>
        <button
          disabled={stateMachine === States.Initial}
          onClick={() => dialog.current?.showModal()}
        >
          Edit
        </button>
      </div>
      <div id="reference-clock-box-input" className="input-group">
        <div className="label">Reference Clock Position</div>
        <button
          disabled={stateMachine === States.Initial}
          onClick={() => dialog.current?.showModal()}
        >
          Edit
        </button>
      </div>
      <button type="submit" onClick={computeLatency} disabled={true}>
        Compute Latency
      </button>
      <dialog ref={dialog}>
        <BoundBoxEditor />
        <button onClick={() => dialog.current?.close()}>Close</button>
      </dialog>
    </form>
  );
}

export default InputForm;
