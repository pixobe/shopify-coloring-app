/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "p-colorswatch": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        name?: string;
        value?: string;
      };
    }
  }
}

export {};
