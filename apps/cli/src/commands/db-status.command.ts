import { BaseCommand } from "./base-command.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { PsqlRunner } from "../lib/psql-runner.js";

export class DbStatusCommand extends BaseCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(args: string[]): Promise<void> {
    try {
      this.logger.info("🗄️  Database Status:\n");

      // Check database connection via health endpoint
      await this.checkHealth();

      // Show migration status
      await PsqlRunner.runQuery(
        "SELECT COUNT(*) as total_migrations FROM _prisma_migrations;",
        "Migration Status",
      );

      // Show table counts
      await PsqlRunner.runQuery(
        `SELECT schemaname, relname as tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes FROM pg_stat_user_tables WHERE schemaname = 'public';`,
        "Table Statistics",
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, "database status");
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      const axios = await import("axios");
      const response = await axios.default.get(
        "http://localhost:3000/health/db",
        {
          timeout: 5000,
        },
      );

      const status = (response.data as Record<string, unknown>)?.data as Record<
        string,
        unknown
      >;
      const statusValue = status?.status;
      if (statusValue === "connected") {
        console.log("✅ Database connection: healthy");
      } else {
        console.log("❌ Database connection: unhealthy");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("❌ Database connection: failed to check");
    }
  }
}
