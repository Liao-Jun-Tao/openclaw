import { Box, Container, Spacer, Text } from "@mariozechner/pi-tui";
import type { RiskLevel } from "../helpers/risk-assessment.js";
import { assessCommandRisk, riskLabel } from "../helpers/risk-assessment.js";
import { theme } from "../theme/theme.js";

export type PermissionResponse = "allow" | "deny" | "always";

export type PermissionRequest = {
  toolName: string;
  toolCallId: string;
  command?: string;
  path?: string;
  description?: string;
};

const RISK_THEME: Record<RiskLevel, (text: string) => string> = {
  low: theme.riskLow,
  medium: theme.riskMedium,
  high: theme.riskHigh,
  critical: theme.riskCritical,
};

/**
 * Overlay dialog shown when a tool execution requires user permission.
 * Displays tool name, risk badge, command/path preview, and keybindings.
 *
 * Visibility is controlled by adding/removing the inner box from the
 * container tree since pi-tui Container has no setVisible API.
 */
export class PermissionDialog extends Container {
  private box: Box;
  private titleLine: Text;
  private riskBadge: Text;
  private previewLine: Text;
  private keybindLine: Text;
  private _visible = false;
  private _request: PermissionRequest | null = null;
  private _onResponse: ((response: PermissionResponse) => void) | null = null;
  private boxAttached = false;

  constructor() {
    super();
    this.box = new Box(1, 1, (line) => theme.toolPendingBg(line));
    this.titleLine = new Text("", 0, 0);
    this.riskBadge = new Text("", 0, 0);
    this.previewLine = new Text("", 0, 0);
    this.keybindLine = new Text("", 0, 0);

    this.box.addChild(this.titleLine);
    this.box.addChild(this.riskBadge);
    this.box.addChild(new Spacer(1));
    this.box.addChild(this.previewLine);
    this.box.addChild(new Spacer(1));
    this.box.addChild(this.keybindLine);
  }

  get visible(): boolean {
    return this._visible;
  }

  get request(): PermissionRequest | null {
    return this._request;
  }

  show(request: PermissionRequest, onResponse: (response: PermissionResponse) => void) {
    this._request = request;
    this._onResponse = onResponse;
    this._visible = true;
    if (!this.boxAttached) {
      this.addChild(new Spacer(1));
      this.addChild(this.box);
      this.boxAttached = true;
    }
    this.refresh();
  }

  hide() {
    this._visible = false;
    this._request = null;
    this._onResponse = null;
    if (this.boxAttached) {
      this.clear();
      this.boxAttached = false;
    }
  }

  handleKey(key: string): boolean {
    if (!this._visible || !this._onResponse) {
      return false;
    }
    const lower = key.toLowerCase();
    if (lower === "y" || lower === "a") {
      const cb = this._onResponse;
      this.hide();
      cb("allow");
      return true;
    }
    if (lower === "n" || lower === "d") {
      const cb = this._onResponse;
      this.hide();
      cb("deny");
      return true;
    }
    if (lower === "!") {
      const cb = this._onResponse;
      this.hide();
      cb("always");
      return true;
    }
    return false;
  }

  private refresh() {
    if (!this._request) {
      return;
    }
    const { toolName, command, path, description } = this._request;

    this.titleLine.setText(theme.bold(theme.accent(`⚠ Permission required: ${toolName}`)));

    const risk = command ? assessCommandRisk(command) : "low";
    const badgeStyle = RISK_THEME[risk];
    this.riskBadge.setText(badgeStyle(`  Risk: ${riskLabel(risk)}`));

    const preview = command ?? path ?? description ?? "";
    this.previewLine.setText(preview ? theme.dim(`  ${preview}`) : "");

    this.keybindLine.setText(theme.system("  [Y]es / Allow   [N]o / Deny   [!] Always allow"));
  }
}
