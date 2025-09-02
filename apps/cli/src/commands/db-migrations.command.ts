import { BaseCommand } from "./base-command.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { PsqlRunner } from "../lib/psql-runner.js";

export class DbMigrationsCommand extends BaseCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(args: string[]): Promise<void> {
    try {
      this.logger.info("📦 Database Migrations:\n");
      await PsqlRunner.runQuery(
        "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;",
        "Recent Migrations",
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, "database migrations");
    }
  }
}
