import type { OutputChannel } from 'vscode';
import { window } from 'vscode';

export class Logger {
  static output?: OutputChannel;

  static init() {
    this.output = this.output ?? window.createOutputChannel('live room');
    this.showOutputChannle();
  }

  static showOutputChannle() {
    this.output?.show();
  }

  static log(message: string) {
    this.output?.appendLine(`${this.timestamp} ${message}`);
  }

  static logWithTime(message: string, time: number) {
    const timeString = new Date(time).toTimeString().split(' ')[0];
    this.output?.appendLine(`[${timeString}] ${message}`);
  }

  static error(message: string) {
    this.output?.appendLine(`${this.timestamp} {Error} ${message}`);
  }

  private static get timestamp(): string {
    const now = new Date();
    return `[${now.toTimeString().split(' ')[0]}]`;
  }
}
