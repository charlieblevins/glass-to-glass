import { Events, type BoundBoxChangePayload } from "./model/events";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import BoundBoxEditor from "./components/boundBoxEditor";
import AnalyzerBuilder from "./analyzer/builder";
import FormError from "./components/formError";
import { FormErrors, type FormErrorEnum } from "./model/formErrors";
import ScreenRecording from "./analyzer/screen-recording";
import { BoundBoxes } from "./model/boundBox";

function InputForm() {
  const builder = useRef<AnalyzerBuilder>(new AnalyzerBuilder());
  const navigate = useNavigate();

  const [firstFrameCanvas, setFirstFrameCanvas] = useState<HTMLCanvasElement>();
  // const [videoAdded, setVideoAdded] = useState(false);

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
  };

  useEffect(() => {
    const onBoundBoxChange = (e: Event) => {
      const payload = (e as CustomEvent).detail as BoundBoxChangePayload;

      if (payload.boxType === BoundBoxes.Capture) {
        builder.current.setCaptureBox(payload);
      } else {
        builder.current.setViewerBox(payload);
      }
    };
    document.addEventListener(Events.BoundBoxChange, onBoundBoxChange);
    return () => {
      document.removeEventListener(Events.BoundBoxChange, onBoundBoxChange);
    };
  }, []);

  // Run analysis
  const computeLatency = () => {
    const [analyzer, err] = builder.current.build();

    if (err || !analyzer) {
      // TODO: handle error
      return;
    }
    // TODO: do something with analyzer
    navigate("/report");
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
      {firstFrameCanvas ? (
        <div>
          <div id="capture-clock-box-input" className="input-group">
            <div className="label">Capture Clock Position</div>
            <BoundBoxEditor
              canvas={firstFrameCanvas}
              builder={builder}
              boxType={BoundBoxes.Capture}
            />
          </div>
          <div id="reference-clock-box-input" className="input-group">
            <div className="label">Viewer Clock Position</div>
            <BoundBoxEditor
              canvas={firstFrameCanvas}
              builder={builder}
              boxType={BoundBoxes.Viewer}
            />
          </div>
        </div>
      ) : (
        <div>Please add a file first</div>
      )}
      <button type="submit" onClick={computeLatency} disabled={true}>
        Compute Latency
      </button>
      <div className="test-link-container">
        <Link to="/test-video-create">Test Video Creator</Link>
      </div>
    </form>
  );
}

export default InputForm;
