import { Events } from "./model/events";
import { States } from "./model/stateMachine";
import { useRef, useState, type ChangeEvent } from "react";
import BoundBoxEditor from "./components/boundBoxEditor";
import AnalyzerBuilder from "./analyzer/builder";
import { dispatch } from "./event";
import FormError from "./components/formError";
import { FormErrors, type FormErrorEnum } from "./model/formErrors";
import ScreenRecording from "./analyzer/screen-recording";

function InputForm({ stateMachine }: { stateMachine: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const builder = useRef<AnalyzerBuilder>(new AnalyzerBuilder());
  const [firstFrameCanvas, setFirstFrameCanvas] = useState<HTMLCanvasElement>();

  const [formError, setFormError] = useState<FormErrorEnum | null>();

  // file added
  const onVideoInputChange = async (e: ChangeEvent) => {
    if (!(e.target instanceof HTMLInputElement)) {
      throw new Error("unexpected input type");
    }

    const { files } = e.target;

    if (!files || !files.length) {
      setFormError(FormErrors.NoScreenRecording);
      return;
    }

    const sr = new ScreenRecording(files[0]);

    const [canvas, err] = await sr.firstFrameCanvas();
    if (err !== null || canvas === null) {
      setFormError(FormErrors.InvalidFile);
      return;
    }
    setFirstFrameCanvas(canvas);

    dispatch(Events.VideoAdded);
  };

  // Run analysis
  const computeLatency = () => {
    const [analyzer, err] = builder.current.build();

    dispatch(Events.InputFormSubmitted);
  };

  return (
    <form id="input-form">
      {formError ? <FormError errorEnum={formError} /> : null}
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
        <BoundBoxEditor canvas={canvas} />
        <button onClick={() => dialog.current?.close()}>Close</button>
      </dialog>
    </form>
  );
}

export default InputForm;
