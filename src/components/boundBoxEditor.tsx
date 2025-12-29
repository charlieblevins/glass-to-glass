import { useRef } from "react";
import BoundBoxFields from "./boundBoxFields";
import { Stage, Layer, Image, Rect, Transformer } from "react-konva";
import useImage from "use-image";

const stageSize = {
  width: 300,
  height: 300,
};
const shape = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
};

// To be played within a modal
function BoundBoxEditor() {
  const transformerRef = useRef(null);
//   const img = useImage()

  return (
    <>
      <BoundBoxFields title="Display Clock Position (px)" prefix="cpp" />
      <Stage width={stageSize.width} height={stageSize.height}>
        {/* <Layer>
            <Image
            image={}
            />
        </Layer> */}
        <Layer>
          <Rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={"red"}
            draggable
          />
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </>
  );
}

export default BoundBoxEditor;
