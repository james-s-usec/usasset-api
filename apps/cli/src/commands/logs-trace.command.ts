import { BaseCommand } from "./base-command.js";
import { LogsApiClient, LogEntry } from "../lib/logs-api-client.js";
import { ErrorHandler } from "../lib/error-handler.js";
import {
  SEPARATOR_LENGTH,
  STACK_FULL_LINES,
  JSON_INDENT_SPACES,
} from "../lib/constants.js";

export class LogsTraceCommand extends BaseCommand {
  private logsApiClient: LogsApiClient;

  public constructor() {
    super();
    this.logsApiClient = new LogsApiClient();
  }

  public async execute(args: string[]): Promise<void> {
    const correlationId = args[0];

    if (!correlationId) {
      this.displayUsage();
      return;
    }

    try {
      this.logger.info(`🔍 Tracing request ${correlationId}...`);
      const logs =
        await this.logsApiClient.getLogsByCorrelationId(correlationId);

      if (logs.length === 0) {
        this.logger.error(
          `❌ No logs found for correlation ID: ${correlationId}`,
        );
        return;
      }

      const sortedLogs = this.sortLogsByTimestamp(logs);
      this.displayTraceResults(correlationId, sortedLogs);
    } catch (error) {
      ErrorHandler.handleApiError(error, "trace request");
    }
  }

  private displayUsage(): void {
    this.logger.error("❌ Please provide a correlation ID");
    this.logger.info("Usage: ./bin/usasset logs trace <correlation-id>");
  }

  private sortLogsByTimestamp(logs: LogEntry[]): LogEntry[] {
    return logs.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  private displayTraceResults(correlationId: string, logs: LogEntry[]): void {
    console.log(`\n🔍 Request Trace for ${correlationId}:`);
    console.log("=".repeat(SEPARATOR_LENGTH));

    logs.forEach((log, index) => {
      this.displayTraceEntry(log, index);
    });

    console.log("=".repeat(SEPARATOR_LENGTH));
    this.displayTraceSummary(logs);
  }

  private displayTraceEntry(log: LogEntry, index: number): void {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const level = this.formatLevel(log.level);

    console.log(`${index + 1}. [${timestamp}] ${level}`);
    console.log(`   ${log.message}`);

    this.displayTraceMetadata(log);
    this.displayFullStackTrace(log);
    console.log("");
  }

  private displayTraceMetadata(log: LogEntry): void {
    this.displayBasicMetadata(log);
    this.displayRequestHeaders(log);
    this.displayRequestBody(log);
    this.displayResponseData(log);
  }

  private displayBasicMetadata(log: LogEntry): void {
    if (log.metadata.method && log.metadata.url) {
      console.log(
        `   📍 ${String(log.metadata.method)} ${String(log.metadata.url)}`,
      );
    }

    if (log.metadata.statusCode) {
      console.log(`   📊 Status: ${String(log.metadata.statusCode)}`);
    }

    if (log.metadata.duration) {
      console.log(`   ⏱️  Duration: ${String(log.metadata.duration)}ms`);
    }

    if (log.metadata.operation) {
      console.log(`   🔧 Operation: ${String(log.metadata.operation)}`);
    }
  }

  private displayRequestHeaders(log: LogEntry): void {
    if (!log.metadata.requestHeaders) return;

    try {
      const headers = JSON.parse(log.metadata.requestHeaders) as Record<
        string,
        unknown
      >;
      console.log(`   📨 Request Headers:`);
      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== "authorization") {
          console.log(`      ${key}: ${String(value)}`);
        }
      });
    } catch {
      // Skip if not valid JSON
    }
  }

  private displayRequestBody(log: LogEntry): void {
    if (!log.metadata.requestBody) return;

    try {
      const body = JSON.parse(log.metadata.requestBody) as Record<
        string,
        unknown
      >;
      if (Object.keys(body).length > 0) {
        console.log(`   📥 Request Body:`);
        const formatted = JSON.stringify(body, null, JSON_INDENT_SPACES);
        console.log(`      ${formatted.replace(/\n/g, "\n      ")}`);
      }
    } catch {
      // Skip if not valid JSON
    }
  }

  private displayResponseData(log: LogEntry): void {
    if (!log.metadata.responseData) return;

    try {
      const response = JSON.parse(log.metadata.responseData) as Record<
        string,
        unknown
      >;
      console.log(`   📤 Response Data:`);
      const formatted = JSON.stringify(response, null, JSON_INDENT_SPACES);
      console.log(`      ${formatted.replace(/\n/g, "\n      ")}`);
    } catch {
      // Skip if not valid JSON
    }
  }

  private displayFullStackTrace(log: LogEntry): void {
    if (this.hasStackTrace(log)) {
      console.log("   📜 Stack Trace:");
      const stackLines = (log.metadata.stack as string).split("\n");

      stackLines.slice(0, STACK_FULL_LINES).forEach((line: string) => {
        console.log(`      ${line}`);
      });

      if (stackLines.length > STACK_FULL_LINES) {
        const remaining = stackLines.length - STACK_FULL_LINES;
        console.log(`      ... and ${remaining} more lines`);
      }
    }
  }

  private hasStackTrace(log: LogEntry): boolean {
    return (
      log.level === "ERROR" &&
      Boolean(log.metadata.stack) &&
      typeof log.metadata.stack === "string"
    );
  }

  private displayTraceSummary(logs: LogEntry[]): void {
    console.log(`\n📊 Summary: ${logs.length} log entries for this request`);

    const counts = this.countLogsByLevel(logs);
    Object.entries(counts).forEach(([level, count]) => {
      console.log(`   ${this.formatLevel(level)} ${level}: ${count}`);
    });
  }

  private countLogsByLevel(logs: LogEntry[]): Record<string, number> {
    return logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private formatLevel(level: string): string {
    const colors: Record<string, string> = {
      ERROR: "❌",
      WARN: "⚠️",
      INFO: "ℹ️",
      DEBUG: "🐛",
    };
    return colors[level] || level;
  }
}
