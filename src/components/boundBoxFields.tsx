import { useState, type ChangeEvent } from "react";
import { Events } from "../model/events";
import { dispatch } from "../event";
import type { BoundBox } from "../model/boundBox";

function BoundBoxFields({
  prefix,
  existingBox,
}: {
  prefix: string;
  existingBox: BoundBox | undefined;
}) {
  const xName = prefix + "-x";
  const yName = prefix + "-y";
  const widthName = prefix + "-width";
  const heightName = prefix + "-height";

  const [localX, setLocalX] = useState<number | undefined>(undefined);
  const [localY, setLocalY] = useState<number | undefined>(undefined);
  const [localWidth, setLocalWidth] = useState<number | undefined>(undefined);
  const [localHeight, setLocalHeight] = useState<number | undefined>(undefined);

  // Display value prioritizes local edits, falls back to existingBox
  const x = localX !== undefined ? localX : (existingBox?.x ?? 0);
  const y = localY !== undefined ? localY : (existingBox?.y ?? 0);
  const width =
    localWidth !== undefined ? localWidth : (existingBox?.width ?? 0);
  const height =
    localHeight !== undefined ? localHeight : (existingBox?.height ?? 0);

  const dispatchChange = (key: keyof BoundBox, newVal: number) => {
    const payload = {
      x,
      y,
      width,
      height,
    };
    payload[key] = newVal;
    dispatch(Events.BoundBoxChange, payload);
  };

  return (
    <fieldset id="bound-box-fields">
      <div id="bound-box-fields-inner">
        <div className="single-field">
          <label htmlFor={xName}>X:</label>
          <input
            type="number"
            id={xName}
            name={xName}
            value={x}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const newX = parseInt(e.target.value, 10);
              dispatchChange("x", newX);
              setLocalX(newX);
            }}
            required
          />
        </div>
        <div className="single-field">
          <label htmlFor={yName}>Y:</label>
          <input
            type="number"
            id={yName}
            name={yName}
            value={y}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const newY = parseInt(e.target.value, 10);
              dispatchChange("y", newY);
              setLocalY(newY);
            }}
            required
          />
        </div>
        <div className="single-field">
          <label htmlFor={widthName}>Width:</label>
          <input
            type="number"
            id={widthName}
            name={widthName}
            value={width}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const newWidth = parseInt(e.target.value, 10);
              dispatchChange("width", newWidth);
              setLocalWidth(newWidth);
            }}
            required
          />
        </div>
        <div className="single-field">
          <label htmlFor={heightName}>Height:</label>
          <input
            type="number"
            id={heightName}
            name={heightName}
            value={height}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const newHeight = parseInt(e.target.value, 10);
              dispatchChange("height", newHeight);
              setLocalHeight(newHeight);
            }}
            required
          />
        </div>
      </div>
    </fieldset>
  );
}

export default BoundBoxFields;
