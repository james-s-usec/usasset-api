import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { ErrorHandler } from "../lib/error-handler.js";

export class UsersDeleteCommand extends BaseCommand {
  private userApiClient: UserApiClient;

  public constructor() {
    super();
    this.userApiClient = new UserApiClient();
  }

  public async execute(
    args: string[],
    options?: CommandOptions,
  ): Promise<void> {
    try {
      const userId = args[0];
      if (!userId) {
        this.logger.error("❌ User ID is required");
        return;
      }

      // Confirm deletion unless --force flag is used
      if (!options?.force) {
        this.logger.warn(`⚠️  This will soft-delete user ${userId}`);
        this.logger.info("Use --force to skip this confirmation");
        return;
      }

      this.logger.info(`🗑️  Deleting user ${userId}...`);
      await this.userApiClient.deleteUser(userId);

      this.logger.success("✅ User deleted successfully!");
    } catch (error) {
      ErrorHandler.handleApiError(error, "delete user");
    }
  }
}
