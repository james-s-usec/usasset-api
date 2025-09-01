import { BaseCommand } from "./base-command.js";
import { UsersListCommand } from "./users-list.command.js";
import { UsersCreateCommand } from "./users-create.command.js";

export class CommandFactory {
  private static commands = new Map<string, () => BaseCommand>([
    ["users:list", (): BaseCommand => new UsersListCommand()],
    ["users:create", (): BaseCommand => new UsersCreateCommand()],
  ]);

  public static createCommand(commandKey: string): BaseCommand | undefined {
    const factory = this.commands.get(commandKey);
    return factory ? factory() : undefined;
  }

  public static getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
