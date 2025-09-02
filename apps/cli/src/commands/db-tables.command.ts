import { BaseCommand } from "./base-command.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { PsqlRunner } from "../lib/psql-runner.js";

export class DbTablesCommand extends BaseCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(args: string[]): Promise<void> {
    try {
      this.logger.info("📋 Database Tables:\n");
      await PsqlRunner.runQuery("\\d", "Tables");
    } catch (error) {
      ErrorHandler.handleApiError(error, "database tables");
    }
  }
}
