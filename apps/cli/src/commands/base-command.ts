import { CliLogger } from "../lib/logger.js";

export interface CommandOptions {
  [key: string]: unknown;
}

export abstract class BaseCommand {
  protected logger: CliLogger;

  public constructor() {
    this.logger = new CliLogger();
  }

  public abstract execute(
    args: string[],
    options: CommandOptions,
  ): Promise<void>;
}
