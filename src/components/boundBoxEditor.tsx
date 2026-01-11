import { useEffect, useRef, useState, type RefObject } from "react";
import BoundBoxFields from "./boundBoxFields";
import { Stage, Layer, Image, Rect, Transformer } from "react-konva";
import Konva from "konva";
import { dispatch } from "../event";
import { BoundBoxes } from "../model/boundBox";
import { Events, type BoundBoxChangePayload } from "../model/events";
import type AnalyzerBuilder from "../analyzer/builder";
import { Dialog } from "@base-ui/react";

interface RectBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundBoxEditorProps {
  canvas: HTMLCanvasElement;
  builder: RefObject<AnalyzerBuilder>;
  boxType: (typeof BoundBoxes)[keyof typeof BoundBoxes];
}

// To be played within a modal
function BoundBoxEditor({ canvas, builder, boxType }: BoundBoxEditorProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRef = useRef<Konva.Rect>(null);

  // Get initial values from builder if they exist based on current boxType
  const getBoxFromBuilder = (): RectBoxProps => {
    if (!builder.current) {
      return { x: 20, y: 20, width: 100, height: 75 };
    }

    const existingBox =
      boxType === BoundBoxes.Capture
        ? builder.current.getCaptureBox()
        : builder.current.getViewerBox();

    if (existingBox) {
      return {
        x: existingBox.x,
        y: existingBox.y,
        width: existingBox.width,
        height: existingBox.height,
      };
    }

    return { x: 20, y: 20, width: 100, height: 75 };
  };

  // Use the boxType-specific values directly instead of managing separate state
  const translatedProps = getBoxFromBuilder();

  // Local state to track transformed dimensions during user interaction
  const [localProps, setLocalProps] = useState<RectBoxProps | null>(null);

  // shape props are used because Transformer changes
  // scale and not size. Shape props are used to translate
  // the shape's transformed scale back to unscaled dimensions.
  // Without this translation, there are problems such as:
  // 1. distortion of the shape
  // 2. incorrect size values after transformation

  const scale = 800 / canvas.width;

  // This effect attaches the transformer to the rectangle
  useEffect(() => {
    if (transformerRef.current && shapeRef.current) {
      // we need to tell transformer which node it should control
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [localProps, translatedProps]);

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          setLocalProps(null);
        }
      }}
    >
      <Dialog.Trigger type="button">Edit</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog-popup">
          <Dialog.Title className="dialog-title">
            Set clock position
          </Dialog.Title>
          <BoundBoxFields
            title="Display Clock Position (px)"
            prefix="cpp"
            existingBox={translatedProps}
          />
          <Stage
            className="test"
            scale={{
              x: scale,
              y: scale,
            }}
            width={800}
            height={(800 / canvas.width) * canvas.height}
          >
            <Layer>
              <Image image={canvas} />
            </Layer>
            <Layer>
              <Rect
                ref={shapeRef}
                {...(localProps || translatedProps)}
                fill="transparent"
                stroke="red"
                strokeWidth={10}
                draggable
                onDragEnd={(e) => {
                  const newProps: BoundBoxChangePayload = {
                    x: e.target.x(),
                    y: e.target.y(),
                    width: e.target.width(),
                    height: e.target.height(),
                    boxType,
                  };
                  setLocalProps(newProps);
                  dispatch(Events.BoundBoxChange, newProps);
                }}
              />
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                keepRatio={false}
                onTransformEnd={() => {
                  // 3. Use the ref to get the current node safely
                  const node = shapeRef.current;
                  if (!node) return;

                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  // Reset scale to 1 to maintain consistent stroke width
                  node.scaleX(1);
                  node.scaleY(1);

                  const newProps: BoundBoxChangePayload = {
                    x: node.x(),
                    y: node.y(),
                    // Ensure dimensions aren't negative or too small
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                    boxType,
                  };
                  setLocalProps(newProps);
                  dispatch(Events.BoundBoxChange, newProps);
                }}
              />
            </Layer>
          </Stage>
          <div className="dialog-actions">
            <Dialog.Close className="dialog-close">Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default BoundBoxEditor;
