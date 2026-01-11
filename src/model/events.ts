import type { BoundBox, BoundBoxes } from "./boundBox";

// all events are prefixed with 'gg' (glass to glass)
export const Events = {
  VideoAdded: "ggVideoAdded",
  InputFormSubmitted: "ggInputFormSubmitted",
  BackToForm: "ggBackToForm",
  BoundBoxChange: "ggBoundBoxChange",
};

export type BoundBoxChangePayload = BoundBox & {
  boxType: typeof BoundBoxes[keyof typeof BoundBoxes];
};
