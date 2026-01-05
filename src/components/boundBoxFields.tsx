import { useEffect, useState, type ChangeEvent } from "react";
import { Events, type BoundBoxChangePayload } from "../model/events";
import { dispatch } from "../event";

function BoundBoxFields({ title, prefix }: { title: string; prefix: string }) {
  const xName = prefix + "-x";
  const yName = prefix + "-y";
  const widthName = prefix + "-width";
  const heightName = prefix + "-height";

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    document.addEventListener(Events.BoundBoxChange, (e: Event) => {
      const payload = (e as CustomEvent).detail as BoundBoxChangePayload;

      if (x !== payload.x) {
        setX(payload.x);
      }
      if (y !== payload.y) {
        setY(payload.y);
      }
      if (width !== payload.width) {
        setWidth(payload.width);
      }
      if (height !== payload.height) {
        setHeight(payload.height);
      }
    });
  });

  const dispatchChange = (key: keyof BoundBoxChangePayload, newVal: number) => {
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
      <legend>{title}</legend>
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
              setX(newX);
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
              setY(newY);
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
              setWidth(newWidth);
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
              setHeight(newHeight);
            }}
            required
          />
        </div>
      </div>
    </fieldset>
  );
}

export default BoundBoxFields;
