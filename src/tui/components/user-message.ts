import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { markdownTheme, theme } from "../theme/theme.js";
import { HyperlinkMarkdown } from "./hyperlink-markdown.js";

export class UserMessageComponent extends Container {
  private body: HyperlinkMarkdown;

  constructor(text: string) {
    super();
    this.addChild(new Spacer(1));

    const gutterLine = new Container();
    gutterLine.addChild(new Text(theme.gutterUser("❯ "), 0, 0));
    this.addChild(gutterLine);

    this.body = new HyperlinkMarkdown(text, 1, 0, markdownTheme, {
      bgColor: (line) => theme.userBg(line),
      color: (line) => theme.userText(line),
    });
    this.addChild(this.body);
  }

  setText(text: string) {
    this.body.setText(text);
  }
}
