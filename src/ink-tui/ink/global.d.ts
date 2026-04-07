import type { DOMElement } from "./dom.js";
import type { Styles } from "./styles.js";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ink-box": {
        ref?: React.Ref<DOMElement>;
        style?: Styles;
        internal_transform?: (s: string) => string;
        internal_static?: boolean;
        children?: React.ReactNode;
      };
      "ink-text": {
        ref?: React.Ref<DOMElement>;
        style?: Styles;
        internal_transform?: (s: string) => string;
        children?: React.ReactNode;
      };
      "ink-virtual-text": {
        style?: Styles;
        internal_transform?: (s: string) => string;
        children?: React.ReactNode;
      };
    }
  }
}
