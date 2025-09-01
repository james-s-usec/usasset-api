import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export class CliLogger {
  private logDir: string;

  public constructor() {
    this.logDir = join(process.cwd(), ".logs");
    this.ensureLogDirectory();
  }

  public info(message: string): void {
    console.log(message);
    this.writeToFile("INFO", message);
  }

  public success(message: string): void {
    console.log(message);
    this.writeToFile("SUCCESS", message);
  }

  public warn(message: string): void {
    console.warn(message);
    this.writeToFile("WARN", message);
  }

  public error(message: string): void {
    console.error(message);
    this.writeToFile("ERROR", message);
  }

  private writeToFile(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    const filename = this.getLogFilename();
    writeFileSync(filename, logEntry, { flag: "a" });
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilename(): string {
    const timestamp = new Date().toISOString().replace(/:/g, "").split(".")[0];
    return join(this.logDir, `cli_${timestamp}.log`);
  }
}
