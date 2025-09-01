import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { ErrorHandler } from "../lib/error-handler.js";
import { MAX_BULK_OPERATION_SIZE } from "../lib/constants.js";
import { readFileSync } from "fs";

export class UsersBulkDeleteCommand extends BaseCommand {
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
      const ids = this.parseIdsInput(options);
      if (ids.length === 0) {
        return;
      }

      if (!this.confirmDeletion(options, ids.length)) {
        return;
      }

      this.logger.info(`🗑️  Deleting ${ids.length} users in bulk...`);
      const result = await this.userApiClient.bulkDeleteUsers(ids);
      this.logger.success(`✅ Successfully deleted ${result.deleted} users!`);
    } catch (error) {
      ErrorHandler.handleApiError(error, "bulk delete users");
    }
  }

  private parseIdsInput(options?: CommandOptions): string[] {
    const fromIds = this.getIdsFromOption(options);
    if (fromIds.length > 0) return this.validateIds(fromIds);

    const fromFile = this.getIdsFromFile(options);
    return this.validateIds(fromFile);
  }

  private getIdsFromOption(options?: CommandOptions): string[] {
    if (!options?.ids) return [];
    const idsValue = typeof options.ids === "string" ? options.ids : "";
    return idsValue ? idsValue.split(",").map((id) => id.trim()) : [];
  }

  private getIdsFromFile(options?: CommandOptions): string[] {
    const filePath = this.getFilePath(options);
    if (!filePath) return [];

    const data = this.readJsonFile(filePath);
    if (!data) return [];

    return this.extractIdsArray(data);
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

  private extractIdsArray(data: unknown): string[] {
    if (Array.isArray(data)) {
      return data.map((id) => String(id));
    }

    const obj = data as Record<string, unknown>;
    if (obj && Array.isArray(obj.ids)) {
      return obj.ids.map((id) => String(id));
    }

    this.logger.error("❌ Invalid format. Expected array or {ids: [...]}");
    return [];
  }

  private validateIds(ids: string[]): string[] {
    if (ids.length === 0) {
      this.logger.error("❌ No user IDs provided");
      return [];
    }
    if (ids.length > MAX_BULK_OPERATION_SIZE) {
      this.logger.error(`❌ Maximum ${MAX_BULK_OPERATION_SIZE} users allowed`);
      return [];
    }
    return ids;
  }

  private confirmDeletion(
    options: CommandOptions | undefined,
    count: number,
  ): boolean {
    if (options?.force) return true;

    this.logger.warn(`⚠️  This will soft-delete ${count} users`);
    this.logger.info("Use --force to skip this confirmation");
    return false;
  }
}
