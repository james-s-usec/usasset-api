import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient, CreateUserRequest } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { MAX_BULK_OPERATION_SIZE } from "../lib/constants.js";
import { readFileSync } from "fs";

export class UsersBulkCreateCommand extends BaseCommand {
  private userApiClient: UserApiClient;

  public constructor() {
    super();
    this.userApiClient = new UserApiClient();
  }

  public async execute(
    _args: string[],
    options?: CommandOptions,
  ): Promise<void> {
    try {
      const users = this.parseUsersInput(options);
      if (users.length === 0) {
        return;
      }

      this.logger.info(`📦 Creating ${users.length} users in bulk...`);
      const createdUsers = await this.userApiClient.bulkCreateUsers(users);

      this.logger.success(
        `✅ Successfully created ${createdUsers.length} users!`,
      );
      console.log(TableFormatter.formatUserTable(createdUsers));
    } catch (error) {
      ErrorHandler.handleApiError(error, "bulk create users");
    }
  }

  private parseUsersInput(options?: CommandOptions): CreateUserRequest[] {
    const filePath = this.getFilePath(options);
    if (!filePath) {
      this.logger.error("❌ Please provide a JSON file with --file option");
      return [];
    }

    const data = this.readJsonFile(filePath);
    if (!data) return [];

    const users = this.extractUsersArray(data);
    if (!this.validateUserCount(users.length)) return [];

    return users;
  }

  private getFilePath(options?: CommandOptions): string | undefined {
    if (!options?.file) return undefined;
    return typeof options.file === "string" ? options.file : undefined;
  }

  private readJsonFile(filePath: string): unknown {
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`❌ Failed to read file: ${message}`);
      return null;
    }
  }

  private extractUsersArray(data: unknown): CreateUserRequest[] {
    if (Array.isArray(data)) {
      return data as CreateUserRequest[];
    }

    const obj = data as Record<string, unknown>;
    if (obj && Array.isArray(obj.users)) {
      return obj.users as CreateUserRequest[];
    }

    this.logger.error("❌ Invalid format. Expected array or {users: [...]}");
    return [];
  }

  private validateUserCount(count: number): boolean {
    if (count === 0) {
      this.logger.error("❌ No users provided");
      return false;
    }
    if (count > MAX_BULK_OPERATION_SIZE) {
      this.logger.error(`❌ Maximum ${MAX_BULK_OPERATION_SIZE} users allowed`);
      return false;
    }
    return true;
  }
}
