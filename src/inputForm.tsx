import { Events, type BoundBoxChangePayload } from "./model/events";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import BoundBoxEditor from "./components/boundBoxEditor";
import AnalyzerBuilder from "./analyzer/builder";
import FormError from "./components/formError";
import { FormErrors, type FormErrorEnum } from "./model/formErrors";
import ScreenRecording from "./analyzer/screen-recording";
import { BoundBoxes, type BoundBox } from "./model/boundBox";
import { analyzerStore } from "./analyzer/analyzerStore";

function InputForm() {
  const analyzerBuilder = useRef<AnalyzerBuilder>(new AnalyzerBuilder());
  const navigate = useNavigate();

  const [firstFrameCanvas, setFirstFrameCanvas] = useState<HTMLCanvasElement>();

  const [formError, setFormError] = useState<FormErrorEnum | null>();
  const [captureBox, setCaptureBox] = useState<BoundBox | null>(null);
  const [viewerBox, setViewerBox] = useState<BoundBox | null>(null);

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

    analyzerBuilder.current.addScreenRecording(sr);

    setFirstFrameCanvas(canvas);
  };

  useEffect(() => {
    const onBoundBoxChange = (e: Event) => {
      const payload = (e as CustomEvent).detail as BoundBoxChangePayload;

      if (payload.boxType === BoundBoxes.Capture) {
        analyzerBuilder.current.setCaptureBox(payload);
        setCaptureBox(payload);
      } else {
        analyzerBuilder.current.setViewerBox(payload);
        setViewerBox(payload);
      }
    };
    document.addEventListener(Events.BoundBoxChange, onBoundBoxChange);
    return () => {
      document.removeEventListener(Events.BoundBoxChange, onBoundBoxChange);
    };
  }, []);

  // Load test data with predefined bounding boxes
  const loadTestData = () => {
    if (!firstFrameCanvas) {
      alert("Please load a video file first");
      return;
    }

    // Predefined test bounding boxes (adjust these values for your test video)
    const testCaptureBox: BoundBox = {
      x: 870,
      y: 99,
      width: 502,
      height: 139,
    };

    const testViewerBox: BoundBox = {
      x: 64,
      y: 102,
      width: 511,
      height: 134,
    };

    // Set the boxes in the builder and state
    analyzerBuilder.current.setCaptureBox(testCaptureBox);
    setCaptureBox(testCaptureBox);

    analyzerBuilder.current.setViewerBox(testViewerBox);
    setViewerBox(testViewerBox);

    // Dispatch events so the BoundBoxEditor components update
    document.dispatchEvent(
      new CustomEvent(Events.BoundBoxChange, {
        detail: { ...testCaptureBox, boxType: BoundBoxes.Capture },
      })
    );
    document.dispatchEvent(
      new CustomEvent(Events.BoundBoxChange, {
        detail: { ...testViewerBox, boxType: BoundBoxes.Viewer },
      })
    );
  };

  // Run analysis
  const computeLatency = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const [analyzer, err] = analyzerBuilder.current.build();

    if (err || !analyzer) {
      alert("error building analyzer. see console for details.");
      return;
    }

    // Store analyzer in the module-level store so it can be accessed by the report page
    analyzerStore.set(analyzer);
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
              builder={analyzerBuilder}
              boxType={BoundBoxes.Capture}
            />
            <div>
              {captureBox ? (
                <span>
                  x: {captureBox.x}, y: {captureBox.y}, width:{" "}
                  {captureBox.width}, height: {captureBox.height}
                </span>
              ) : (
                <span>Not set</span>
              )}
            </div>
          </div>
          <div id="reference-clock-box-input" className="input-group">
            <div className="label">Viewer Clock Position</div>
            <BoundBoxEditor
              canvas={firstFrameCanvas}
              builder={analyzerBuilder}
              boxType={BoundBoxes.Viewer}
            />
            <div>
              {viewerBox ? (
                <span>
                  x: {viewerBox.x}, y: {viewerBox.y}, width: {viewerBox.width},
                  height: {viewerBox.height}
                </span>
              ) : (
                <span>Not set</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>Please add a file first</div>
      )}
      <button
        type="submit"
        onClick={computeLatency}
        disabled={Boolean(!viewerBox || !captureBox)}
      >
        Compute Latency
      </button>
      <div className="test-link-container">
        <button
          type="button"
          onClick={loadTestData}
          disabled={!firstFrameCanvas}
        >
          Load Test Data
        </button>
        {import.meta.env.VITE_ENABLE_TEST_VIDEO_CREATOR === "true" && (
          <Link to="/test-video-create">Test Video Creator</Link>
        )}
      </div>
    </form>
  );
}

export default InputForm;
