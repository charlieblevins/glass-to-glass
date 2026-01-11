import { Events, type BoundBoxChangePayload } from "./model/events";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import BoundBoxEditor from "./components/boundBoxEditor";
import AnalyzerBuilder from "./analyzer/builder";
import FormError from "./components/formError";
import { FormErrors, type FormErrorEnum } from "./model/formErrors";
import ScreenRecording from "./analyzer/screen-recording";

const BoundBoxes = {
  Capture: 1,
  Viewer: 2,
};

function InputForm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const builder = useRef<AnalyzerBuilder>(new AnalyzerBuilder());
  const navigate = useNavigate();

  const currentBox = useRef<number>(BoundBoxes.Capture);

  const [firstFrameCanvas, setFirstFrameCanvas] = useState<HTMLCanvasElement>();
  const [videoAdded, setVideoAdded] = useState(false);

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

    builder.current.addScreenRecording(sr);

    setFirstFrameCanvas(canvas);
    setVideoAdded(true);
  };

  useEffect(() => {
    const onBoundBoxChange = (e: Event) => {
      const payload = (e as CustomEvent).detail as BoundBoxChangePayload;

      if (currentBox.current === BoundBoxes.Capture) {
        builder.current.setCaptureBox(payload);
      } else {
        builder.current.setViewerBox(payload);
      }
    };
    document.addEventListener(Events.BoundBoxChange, onBoundBoxChange);
    return () => {
      document.removeEventListener(Events.BoundBoxChange, onBoundBoxChange);
    }
  }, []);

  // Run analysis
  const computeLatency = () => {
    const [analyzer, err] = builder.current.build();

    if (err || !analyzer) {
        // TODO: handle error
        return;
    }
    // TODO: do something with analyzer
    navigate('/report')
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
          type="button"
          disabled={!videoAdded}
          onClick={() => {
            currentBox.current = BoundBoxes.Capture;
            dialog.current?.showModal();
          }}
        >
          Edit
        </button>
      </div>
      <div id="reference-clock-box-input" className="input-group">
        <div className="label">Reference Clock Position</div>
        <button
          type="button"
          disabled={!videoAdded}
          onClick={() => {
            currentBox.current = BoundBoxes.Viewer;
            dialog.current?.showModal();
          }}
        >
          Edit
        </button>
      </div>
      <button type="submit" onClick={computeLatency} disabled={true}>
        Compute Latency
      </button>
      {firstFrameCanvas ? (
        <dialog ref={dialog}>
          <BoundBoxEditor canvas={firstFrameCanvas} />
          <button type="button" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </dialog>
      ) : null}
    </form>
  );
}

export default InputForm;
