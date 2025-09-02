import { BaseCommand } from "./base-command.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { PsqlRunner } from "../lib/psql-runner.js";

export class DbQueryCommand extends BaseCommand {
  public async execute(args: string[]): Promise<void> {
    try {
      const query = args.join(" ");
      
      if (!query) {
        this.logger.error("❌ No SQL query provided");
        console.log("Usage: usasset db:query \"SELECT * FROM users\"");
        return;
      }

      this.logger.info(`🔍 Running query: ${query}\n`);
      await PsqlRunner.runQuery(query, "Query Results");
      
    } catch (error) {
      ErrorHandler.handleApiError(error, "database query");
    }
  }
}