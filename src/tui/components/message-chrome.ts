import type { Component } from "@mariozechner/pi-tui";
import { Container, Text } from "@mariozechner/pi-tui";

/**
 * Wraps a child component with a left gutter marker (e.g. "⎿" for assistant, "❯" for user).
 * The gutter character occupies a fixed column on the left, and the content body
 * is indented to the right.
 */
export class MessageChrome extends Container {
  private gutter: Text;
  private body: Container;

  constructor(gutterChar: string, gutterStyle: (text: string) => string) {
    super();
    this.gutter = new Text(gutterStyle(gutterChar), 0, 0);
    this.body = new Container();
    this.addChild(this.gutter);
    this.addChild(this.body);
  }

  setContent(component: Component) {
    this.body.clear();
    this.body.addChild(component);
  }

  getBody(): Container {
    return this.body;
  }
}
