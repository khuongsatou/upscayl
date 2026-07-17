import type { Dispatch, SetStateAction } from "react";

export type ImageScaleSelectProps = {
  scale: string;
  setScale: Dispatch<SetStateAction<string>>;
  hideInfo?: boolean;
};
