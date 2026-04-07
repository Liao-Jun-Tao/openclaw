import type { Component, DefaultTextStyle, MarkdownTheme } from "@mariozechner/pi-tui";
import { Markdown } from "@mariozechner/pi-tui";
import { addOsc8Hyperlinks, extractUrls } from "../osc8-hyperlinks.js";

/**
 * Find the last complete markdown block boundary (double newline) so we can
 * split text into a stable prefix that won't re-parse and a growing tail.
 */
function findLastBlockBoundary(text: string): number {
  const idx = text.lastIndexOf("\n\n");
  if (idx <= 0) {
    return 0;
  }
  return idx + 2;
}

/**
 * Streaming-aware markdown component that splits text at the last complete
 * block boundary. The stable prefix is only re-rendered when it changes,
 * while the growing tail is re-parsed on every update. This avoids
 * flicker during incremental streaming.
 */
export class StreamingMarkdown implements Component {
  private prefixMarkdown: Markdown;
  private tailMarkdown: Markdown;
  private cachedPrefixText = "";
  private cachedTailText = "";
  private fullText = "";
  private urls: string[] = [];
  private streaming = true;

  constructor(
    text: string,
    paddingX: number,
    paddingY: number,
    private theme: MarkdownTheme,
    private options?: DefaultTextStyle,
  ) {
    this.prefixMarkdown = new Markdown("", paddingX, paddingY, theme, options);
    this.tailMarkdown = new Markdown("", paddingX, 0, theme, options);
    this.fullText = text;
    this.urls = extractUrls(text);
    this.splitAndUpdate();
  }

  render(width: number): string[] {
    if (!this.streaming || !this.cachedPrefixText) {
      const lines = this.tailMarkdown.render(width);
      return addOsc8Hyperlinks(lines, this.urls);
    }
    const prefixLines = this.prefixMarkdown.render(width);
    const tailLines = this.tailMarkdown.render(width);
    return addOsc8Hyperlinks([...prefixLines, ...tailLines], this.urls);
  }

  setText(text: string): void {
    this.fullText = text;
    this.urls = extractUrls(text);
    this.splitAndUpdate();
  }

  setStreaming(streaming: boolean): void {
    this.streaming = streaming;
    if (!streaming) {
      this.cachedPrefixText = "";
      this.prefixMarkdown.setText("");
      this.tailMarkdown.setText(this.fullText);
    }
  }

  invalidate(): void {
    this.prefixMarkdown.invalidate();
    this.tailMarkdown.invalidate();
  }

  private splitAndUpdate() {
    if (!this.streaming) {
      this.tailMarkdown.setText(this.fullText);
      return;
    }

    const boundary = findLastBlockBoundary(this.fullText);
    const prefix = boundary > 0 ? this.fullText.slice(0, boundary) : "";
    const tail = boundary > 0 ? this.fullText.slice(boundary) : this.fullText;

    if (prefix !== this.cachedPrefixText) {
      this.cachedPrefixText = prefix;
      this.prefixMarkdown.setText(prefix);
    }

    if (tail !== this.cachedTailText) {
      this.cachedTailText = tail;
      this.tailMarkdown.setText(tail);
    }
  }
}
