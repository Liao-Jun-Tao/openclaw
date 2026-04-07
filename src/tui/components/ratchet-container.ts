import type { Component } from "@mariozechner/pi-tui";

/**
 * Height-stable wrapper that ensures rendered height only grows during
 * active streaming. Prevents visual jumping when markdown re-parse
 * produces temporarily shorter output. Call release() when streaming
 * finishes to allow the height to shrink freely again.
 */
export class RatchetContainer implements Component {
  private maxHeight = 0;
  private locked = true;

  constructor(private child: Component) {}

  render(width: number): string[] {
    const lines = this.child.render(width);
    if (this.locked) {
      if (lines.length > this.maxHeight) {
        this.maxHeight = lines.length;
      }
      while (lines.length < this.maxHeight) {
        lines.push("");
      }
    }
    return lines;
  }

  invalidate(): void {
    this.child.invalidate();
  }

  release(): void {
    this.locked = false;
    this.maxHeight = 0;
  }

  lock(): void {
    this.locked = true;
  }
}
