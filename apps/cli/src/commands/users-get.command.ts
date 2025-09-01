import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";

export class UsersGetCommand extends BaseCommand {
  private userApiClient: UserApiClient;

  public constructor() {
    super();
    this.userApiClient = new UserApiClient();
  }

  public async execute(
    args: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: CommandOptions,
  ): Promise<void> {
    try {
      const userId = args[0];
      if (!userId) {
        this.logger.error("❌ User ID is required");
        return;
      }

      this.logger.info(`🔍 Fetching user ${userId}...`);
      const user = await this.userApiClient.getUserById(userId);

      console.log(TableFormatter.formatUserTable([user]));
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch user");
    }
  }
}
