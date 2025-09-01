import { BaseCommand, CommandOptions } from "./base-command.js";
import { LogsApiClient, LogEntry } from "../lib/logs-api-client.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { SEPARATOR_LENGTH, STACK_PREVIEW_LINES } from "../lib/constants.js";

export class LogsErrorsCommand extends BaseCommand {
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
      const limit = this.parseNumericOption(options?.limit, "10");

      this.logger.info("🔍 Fetching recent errors...");
      const response = await this.logsApiClient.getLogs(1, limit, "ERROR");

      if (response.logs.length === 0) {
        this.logger.success("✅ No recent errors found!");
        return;
      }

      this.displayErrorSummary(response.logs.length);
      this.displayErrors(response.logs);
      this.displayErrorsFooter(limit, response.pagination.total);
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch error logs");
    }
  }

  private displayErrorSummary(count: number): void {
    console.log(`\n❌ Found ${count} recent errors:\n`);
    console.log("=".repeat(SEPARATOR_LENGTH));
  }

  private displayErrors(logs: LogEntry[]): void {
    logs.forEach((log, index) => {
      this.displaySingleError(log, index);
    });
    console.log("=".repeat(SEPARATOR_LENGTH));
  }

  private displaySingleError(log: LogEntry, index: number): void {
    const timestamp = new Date(log.timestamp).toLocaleString();

    console.log(`${index + 1}. [${timestamp}] Error ID: ${log.correlation_id}`);
    console.log(`   Message: ${log.message}`);

    this.displayErrorMetadata(log);
    this.displayStackPreview(log);
    console.log("");
  }

  private displayErrorMetadata(log: LogEntry): void {
    if (log.metadata.url && log.metadata.method) {
      console.log(
        `   Request: ${String(log.metadata.method)} ${String(log.metadata.url)}`,
      );
    }

    if (log.metadata.statusCode) {
      console.log(`   Status: ${String(log.metadata.statusCode)}`);
    }

    if (log.metadata.userAgent) {
      console.log(`   User Agent: ${String(log.metadata.userAgent)}`);
    }
  }

  private displayStackPreview(log: LogEntry): void {
    if (log.metadata.stack && typeof log.metadata.stack === "string") {
      const stackLines = log.metadata.stack
        .split("\n")
        .slice(0, STACK_PREVIEW_LINES);
      console.log(`   Stack: ${stackLines.join(" → ")}`);
      console.log(
        `   💡 Full trace: ./bin/usasset logs trace ${log.correlation_id}`,
      );
    }
  }

  private displayErrorsFooter(limit: number, total: number): void {
    if (total > limit) {
      console.log(`\n⚠️  Showing ${limit} of ${total} total errors`);
      console.log(`   Use --limit ${total} to see all errors`);
    }
  }

  private parseNumericOption(value: unknown, defaultValue: string): number {
    if (typeof value === "string" && !isNaN(Number(value))) {
      return parseInt(value, 10);
    }
    return parseInt(defaultValue, 10);
  }
}
