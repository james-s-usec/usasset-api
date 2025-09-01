import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";

export class UsersUpdateCommand extends BaseCommand {
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

      const updateData = this.buildUpdateData(options || {});
      if (Object.keys(updateData).length === 0) {
        this.logger.error("❌ No update fields provided");
        return;
      }

      this.logger.info(`📝 Updating user ${userId}...`);
      const user = await this.userApiClient.updateUser(userId, updateData);

      this.logger.success("✅ User updated successfully!");
      console.log(TableFormatter.formatUserTable([user]));
    } catch (error) {
      ErrorHandler.handleApiError(error, "update user");
    }
  }

  private buildUpdateData(options: CommandOptions): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (options.email !== undefined) {
      data.email = this.getStringValue(options.email);
    }
    if (options.name !== undefined) {
      data.name = this.getStringValue(options.name);
    }
    if (options.role !== undefined) {
      data.role = this.getStringValue(options.role)?.toUpperCase();
    }

    return data;
  }

  private getStringValue(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "boolean" || typeof value === "number") {
      return String(value);
    }
    return undefined;
  }
}
