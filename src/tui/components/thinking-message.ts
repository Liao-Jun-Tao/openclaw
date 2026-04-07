import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { theme } from "../theme/theme.js";

/**
 * Renders AI thinking blocks in the chat log.
 *
 * Collapsed (default after finalization): single dim italic line "∴ Thinking..."
 * Expanded (during streaming or toggled): full thinking text in dim italic.
 */
export class ThinkingMessageComponent extends Container {
  private label: Text;
  private bodyText: Text;
  private text: string;
  private _expanded = false;
  private streaming = true;
  private bodyAttached = false;

  constructor(text: string) {
    super();
    this.text = text;

    this.addChild(new Spacer(1));

    this.label = new Text("", 0, 0);
    this.addChild(this.label);

    this.bodyText = new Text("", 1, 0);

    this.refresh();
  }

  get expanded(): boolean {
    return this._expanded;
  }

  setText(text: string) {
    this.text = text;
    this.refresh();
  }

  setExpanded(expanded: boolean) {
    this._expanded = expanded;
    this.refresh();
  }

  setStreaming(streaming: boolean) {
    this.streaming = streaming;
    this.refresh();
  }

  toggleExpanded() {
    this._expanded = !this._expanded;
    this.refresh();
  }

  private refresh() {
    const showBody = (this._expanded || this.streaming) && this.text.length > 0;
    const prefix = this.streaming ? "∴ Thinking..." : "∴ Thinking";
    const suffix = !showBody && this.text ? "  (Ctrl+O to expand)" : "";

    this.label.setText(theme.thinkingPrefix(`${prefix}${suffix}`));

    if (showBody) {
      this.bodyText.setText(theme.thinkingText(this.text));
      if (!this.bodyAttached) {
        this.addChild(this.bodyText);
        this.bodyAttached = true;
      }
    } else {
      this.bodyText.setText("");
      if (this.bodyAttached) {
        this.removeChild(this.bodyText);
        this.bodyAttached = false;
      }
    }
  }
}
