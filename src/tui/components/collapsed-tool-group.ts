import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { theme } from "../theme/theme.js";
import type { ToolExecutionComponent } from "./tool-execution.js";

/**
 * Groups consecutive read-only tool calls into a single collapsed line.
 * When collapsed: "📖 Read 3 files (Ctrl+O to expand)"
 * When expanded: shows individual tool components.
 */
export class CollapsedToolGroup extends Container {
  private tools: ToolExecutionComponent[] = [];
  private summaryLine: Text;
  private _expanded = false;

  constructor() {
    super();
    this.addChild(new Spacer(1));
    this.summaryLine = new Text("", 0, 0);
    this.addChild(this.summaryLine);
    this.refreshSummary();
  }

  addTool(tool: ToolExecutionComponent) {
    this.tools.push(tool);
    if (this._expanded) {
      this.addChild(tool);
    }
    this.refreshSummary();
  }

  get toolCount(): number {
    return this.tools.length;
  }

  get expanded(): boolean {
    return this._expanded;
  }

  setExpanded(expanded: boolean) {
    if (this._expanded === expanded) {
      return;
    }
    this._expanded = expanded;
    if (expanded) {
      for (const tool of this.tools) {
        this.addChild(tool);
      }
      this.summaryLine.setText("");
    } else {
      for (const tool of this.tools) {
        this.removeChild(tool);
      }
      this.refreshSummary();
    }
  }

  private refreshSummary() {
    if (this._expanded) {
      this.summaryLine.setText("");
      return;
    }
    const count = this.tools.length;
    const label = count === 1 ? "1 file" : `${count} files`;
    this.summaryLine.setText(theme.dim(`📖 Read ${label}  (Ctrl+O to expand)`));
  }
}
