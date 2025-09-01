import { BaseCommand } from "./base-command.js";
import { UsersListCommand } from "./users-list.command.js";
import { UsersCreateCommand } from "./users-create.command.js";
import { UsersGetCommand } from "./users-get.command.js";
import { UsersUpdateCommand } from "./users-update.command.js";
import { UsersDeleteCommand } from "./users-delete.command.js";
import { UsersBulkCreateCommand } from "./users-bulk-create.command.js";
import { UsersBulkUpdateCommand } from "./users-bulk-update.command.js";
import { UsersBulkDeleteCommand } from "./users-bulk-delete.command.js";
import { LogsListCommand } from "./logs-list.command.js";
import { LogsErrorsCommand } from "./logs-errors.command.js";
import { LogsTraceCommand } from "./logs-trace.command.js";
import { ApiDocsCommand } from "./api-docs.command.js";

export class CommandFactory {
  private static commands = new Map<string, () => BaseCommand>([
    ["users:list", (): BaseCommand => new UsersListCommand()],
    ["users:create", (): BaseCommand => new UsersCreateCommand()],
    ["users:get", (): BaseCommand => new UsersGetCommand()],
    ["users:update", (): BaseCommand => new UsersUpdateCommand()],
    ["users:delete", (): BaseCommand => new UsersDeleteCommand()],
    ["users:bulk-create", (): BaseCommand => new UsersBulkCreateCommand()],
    ["users:bulk-update", (): BaseCommand => new UsersBulkUpdateCommand()],
    ["users:bulk-delete", (): BaseCommand => new UsersBulkDeleteCommand()],
    ["logs:list", (): BaseCommand => new LogsListCommand()],
    ["logs:errors", (): BaseCommand => new LogsErrorsCommand()],
    ["logs:trace", (): BaseCommand => new LogsTraceCommand()],
    ["api-docs", (): BaseCommand => new ApiDocsCommand()],
  ]);

  public static createCommand(commandKey: string): BaseCommand | undefined {
    const factory = this.commands.get(commandKey);
    return factory ? factory() : undefined;
  }

  public static getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
