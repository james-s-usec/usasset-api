import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { MAX_BULK_OPERATION_SIZE } from "../lib/constants.js";
import { readFileSync } from "fs";

interface UserUpdate {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export class UsersBulkUpdateCommand extends BaseCommand {
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
      const updates = this.parseUpdatesInput(options);
      if (updates.length === 0) {
        return;
      }

      this.logger.info(`📝 Updating ${updates.length} users in bulk...`);
      const updatedUsers = await this.userApiClient.bulkUpdateUsers(updates);

      this.logger.success(
        `✅ Successfully updated ${updatedUsers.length} users!`,
      );
      console.log(TableFormatter.formatUserTable(updatedUsers));
    } catch (error) {
      ErrorHandler.handleApiError(error, "bulk update users");
    }
  }

  private parseUpdatesInput(options?: CommandOptions): UserUpdate[] {
    const filePath = this.getFilePath(options);
    if (!filePath) {
      this.logger.error("❌ Please provide a JSON file with --file option");
      return [];
    }

    const data = this.readJsonFile(filePath);
    if (!data) return [];

    const updates = this.extractUpdatesArray(data);
    if (!this.validateUpdateCount(updates.length)) return [];

    return updates;
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

  private extractUpdatesArray(data: unknown): UserUpdate[] {
    if (Array.isArray(data)) {
      return this.validateUpdates(data);
    }

    const obj = data as Record<string, unknown>;
    if (obj && Array.isArray(obj.updates)) {
      return this.validateUpdates(obj.updates);
    }

    this.logger.error("❌ Invalid format. Expected array or {updates: [...]}");
    return [];
  }

  private validateUpdates(updates: unknown[]): UserUpdate[] {
    const valid: UserUpdate[] = [];

    for (const update of updates) {
      if (this.isValidUpdate(update)) {
        valid.push(update as UserUpdate);
      } else {
        this.logger.warn("⚠️  Skipping invalid update entry (missing id)");
      }
    }

    return valid;
  }

  private isValidUpdate(update: unknown): boolean {
    if (typeof update !== "object" || update === null) return false;
    const obj = update as Record<string, unknown>;
    return typeof obj.id === "string";
  }

  private validateUpdateCount(count: number): boolean {
    if (count === 0) {
      this.logger.error("❌ No updates provided");
      return false;
    }
    if (count > MAX_BULK_OPERATION_SIZE) {
      this.logger.error(`❌ Maximum ${MAX_BULK_OPERATION_SIZE} users allowed`);
      return false;
    }
    return true;
  }
}
