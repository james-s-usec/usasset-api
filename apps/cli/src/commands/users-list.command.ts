import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";

export class UsersListCommand extends BaseCommand {
  private userApiClient: UserApiClient;

  public constructor() {
    super();
    this.userApiClient = new UserApiClient();
  }

  private parseNumericOption(value: unknown, defaultValue: string): number {
    return parseInt(
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : defaultValue,
    );
  }

  public async execute(
    _args: string[],
    options?: CommandOptions,
  ): Promise<void> {
    try {
      const page = this.parseNumericOption(options?.page, "1");
      const limit = this.parseNumericOption(options?.limit, "50");

      this.logger.info("📋 Fetching users...");
      const response = await this.userApiClient.listUsers(page, limit);

      if (response.data.length === 0) {
        this.logger.info("No users found.");
        return;
      }

      console.log(TableFormatter.formatUserTable(response.data));
      this.logger.info(
        `\nShowing ${response.data.length} of ${response.total} users (Page ${page})`,
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch users");
    }
  }
}
