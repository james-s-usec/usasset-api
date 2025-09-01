import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export class CliLogger {
  private logDir: string;

  public constructor() {
    this.logDir = join(process.cwd(), ".logs");
    this.ensureLogDirectory();
  }

  public log(command: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] 🔧 CLI: ${message}\n`;

    // Log to console
    console.log(message);

    // Log to file (following existing .logs/ pattern)
    const filename = this.getLogFilename(command);
    writeFileSync(filename, logEntry, { flag: "a" });
  }

  public error(command: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ❌ CLI ERROR: ${message}\n`;

    // Log to console
    console.error(message);

    // Log to file
    const filename = this.getLogFilename(command);
    writeFileSync(filename, logEntry, { flag: "a" });
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilename(command: string): string {
    const timestamp = new Date().toISOString().replace(/:/g, "").split(".")[0];
    return join(this.logDir, `cli-${command}_${timestamp}.log`);
  }
}
