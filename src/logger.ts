import { OutputChannel, window } from "vscode";

export class Logger {
  static output?: OutputChannel;

  static init() {
    this.output = this.output ?? window.createOutputChannel("live room");
    this.showOutputChannle();
  }

  static showOutputChannle() {
    this.output?.show();
  }

  static log(message: string) {
    this.output?.appendLine(`${this.timestamp} ${message}`);
  }

  private static get timestamp(): string {
    const now = new Date();
    return `[${now.toTimeString().split(" ")[0]}]`;
  }
}
