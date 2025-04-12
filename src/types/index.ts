export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  containerId?: string;
}

export type TransitionFunction = (callback: () => void, duration?: number, easing?: string) => void;
