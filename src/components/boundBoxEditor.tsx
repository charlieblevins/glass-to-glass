import { useEffect, useRef } from "react";
import BoundBoxFields from "./boundBoxFields";
import { Stage, Layer, Image, Rect, Transformer } from "react-konva";
import Konva from "konva";
import { dispatch } from "../event";
import { Events, type BoundBoxChangePayload } from "../model/events";
import { APP_WIDTH_PX } from "../model/appWidth";

const shape = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
};

// To be played within a modal
function BoundBoxEditor({ canvas }: { canvas: HTMLCanvasElement }) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRef = useRef(null);

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
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={"red"}
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
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </>
  );
}

export default BoundBoxEditor;
