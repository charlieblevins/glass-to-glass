import { useEffect, useRef, useState } from "react";
import BoundBoxFields from "./boundBoxFields";
import { Stage, Layer, Image, Rect, Transformer } from "react-konva";
import Konva from "konva";
import { dispatch } from "../event";
import { Events, type BoundBoxChangePayload } from "../model/events";
import { APP_WIDTH_PX } from "../model/appWidth";

interface RectBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

// To be played within a modal
function BoundBoxEditor({ canvas }: { canvas: HTMLCanvasElement }) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRef = useRef<Konva.Rect>(null);

  const [translatedProps, setTranslatedProps] = useState<RectBoxProps>({
    x: 20,
    y: 20,
    width: 100,
    height: 75,
  });

  // shape props are used because Transformer changes
  // scale and not size. Shape props are used to translate
  // the shape's transformed scale back to unscaled dimensions.
  // Without this translation, there are problems such as:
  // 1. distortion of the shape
  // 2. incorrect size values after transformation

  const scale = APP_WIDTH_PX / canvas.width;

  // This effect attaches the transformer to the rectangle
  useEffect(() => {
    if (transformerRef.current && shapeRef.current) {
      // we need to tell transformer which node it should control
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, []);

  return (
    <>
      <BoundBoxFields title="Display Clock Position (px)" prefix="cpp" />
      <Stage
        scale={{
          x: scale,
          y: scale,
        }}
        width={canvas.width}
        height={canvas.height}
      >
        <Layer>
          <Image image={canvas} />
        </Layer>
        <Layer>
          <Rect
            ref={shapeRef}
            {...translatedProps}
            fill="transparent"
            stroke="red"
            strokeWidth={2}
            draggable
            onDragEnd={(e) => {
              const payload: BoundBoxChangePayload = {
                x: e.target.x(),
                y: e.target.y(),
                width: e.target.width(),
                height: e.target.height(),
              };
              dispatch(Events.BoundBoxChange, payload);
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

              setTranslatedProps({
                x: node.x(),
                y: node.y(),
                // Ensure dimensions aren't negative or too small
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
              });
            }}
          />
        </Layer>
      </Stage>
    </>
  );
}

export default BoundBoxEditor;
