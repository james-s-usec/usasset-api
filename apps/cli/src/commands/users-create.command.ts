import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";
import { ErrorHandler } from "../lib/error-handler.js";

export class UsersCreateCommand extends BaseCommand {
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
      this.logger.info("👤 Creating user...");

      // Safely extract string values from options
      const emailValue = this.getStringOption(options?.email, "") ?? "";
      const nameValue = this.getStringOption(options?.name);
      const roleValue = (
        this.getStringOption(options?.role, "USER") ?? "USER"
      ).toUpperCase();

      const userData = {
        email: emailValue,
        name: nameValue,
        role: roleValue,
      };

      const user = await this.userApiClient.createUser(userData);

      this.logger.success("✅ User created successfully!");
      console.log(TableFormatter.formatUserTable([user]));
    } catch (error) {
      ErrorHandler.handleApiError(error, "create user");
    }
  }

  private getStringOption(
    value: unknown,
    defaultValue?: string,
  ): string | undefined {
    if (!this.hasValue(value)) {
      return defaultValue;
    }

    const stringValue = this.convertToString(value);
    return stringValue ?? defaultValue;
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null;
  }

  private convertToString(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (typeof value === "boolean" || typeof value === "number") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return this.getStringFromArray(value);
    }
    return undefined;
  }

  private getStringFromArray(arr: unknown[]): string | undefined {
    if (arr.length === 0) return undefined;
    const lastValue: unknown = arr[arr.length - 1];
    return typeof lastValue === "string" ? lastValue : undefined;
  }
}
