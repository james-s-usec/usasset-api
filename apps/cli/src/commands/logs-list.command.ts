import { BaseCommand, CommandOptions } from "./base-command.js";
import { LogsApiClient, LogEntry } from "../lib/logs-api-client.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { SEPARATOR_LENGTH } from "../lib/constants.js";

export class LogsListCommand extends BaseCommand {
  private logsApiClient: LogsApiClient;

  public constructor() {
    super();
    this.logsApiClient = new LogsApiClient();
  }

  public async execute(
    _args: string[],
    options?: CommandOptions,
  ): Promise<void> {
    try {
      const page = this.parseNumericOption(options?.page, "1");
      const limit = this.parseNumericOption(options?.limit, "10");
      const level = this.getStringOption(options?.level);

      this.logger.info("📋 Fetching logs...");
      const response = await this.logsApiClient.getLogs(page, limit, level);

      if (response.logs.length === 0) {
        this.logger.info("No logs found");
        return;
      }

      this.displayLogs(response.logs);
      this.displayPagination(
        response.logs.length,
        page,
        response.pagination.totalPages,
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch logs");
    }
  }

  private displayLogs(logs: LogEntry[]): void {
    console.log("\n" + "=".repeat(SEPARATOR_LENGTH));
    logs.forEach((log, index) => {
      this.displaySingleLog(log, index);
    });
    console.log("=".repeat(SEPARATOR_LENGTH));
  }

  private displaySingleLog(log: LogEntry, index: number): void {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const level = this.formatLevel(log.level);

    console.log(`${index + 1}. [${timestamp}] ${level} ${log.correlation_id}`);
    console.log(`   ${log.message}`);

    this.displayLogMetadata(log);
    console.log("");
  }

  private displayLogMetadata(log: LogEntry): void {
    if (this.hasRequestMetadata(log)) {
      const method = String(log.metadata.method);
      const url = String(log.metadata.url);
      const statusCode = String(log.metadata.statusCode);
      console.log(`   → ${method} ${url} (${statusCode})`);
    }

    if (log.metadata.duration) {
      console.log(`   ⏱️  ${String(log.metadata.duration)}ms`);
    }
  }

  private hasRequestMetadata(log: LogEntry): boolean {
    return Boolean(
      log.metadata.url && log.metadata.method && log.metadata.statusCode,
    );
  }

  private displayPagination(
    count: number,
    page: number,
    totalPages: number,
  ): void {
    console.log(`\nShowing ${count} logs (Page ${page}/${totalPages})`);
  }

  private formatLevel(level: string): string {
    const colors: Record<string, string> = {
      ERROR: "❌",
      WARN: "⚠️ ",
      INFO: "ℹ️ ",
      DEBUG: "🐛",
    };
    return colors[level] || level;
  }

  private parseNumericOption(value: unknown, defaultValue: string): number {
    if (typeof value === "string" && !isNaN(Number(value))) {
      return parseInt(value, 10);
    }
    return parseInt(defaultValue, 10);
  }

  private getStringOption(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    return undefined;
  }
}
