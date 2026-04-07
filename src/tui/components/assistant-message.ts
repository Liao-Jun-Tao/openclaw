import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { markdownTheme, theme } from "../theme/theme.js";
import { RatchetContainer } from "./ratchet-container.js";
import { StreamingMarkdown } from "./streaming-markdown.js";

export class AssistantMessageComponent extends Container {
  private body: StreamingMarkdown;
  private ratchet: RatchetContainer;

  constructor(text: string) {
    super();
    this.addChild(new Spacer(1));

    const gutterLine = new Container();
    gutterLine.addChild(new Text(theme.gutterAssistant("⎿ "), 0, 0));
    this.addChild(gutterLine);

    this.body = new StreamingMarkdown(text, 1, 0, markdownTheme, {
      color: (line) => theme.assistantText(line),
    });
    this.ratchet = new RatchetContainer(this.body);
    this.addChild(this.ratchet);
  }

  setText(text: string) {
    this.body.setText(text);
  }

  setStreaming(streaming: boolean) {
    this.body.setStreaming(streaming);
    if (!streaming) {
      this.ratchet.release();
    }
  }
}
