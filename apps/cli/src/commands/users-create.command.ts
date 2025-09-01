import { BaseCommand, CommandOptions } from "./base-command.js";
import { UserApiClient } from "../lib/user-api-client.js";
import { TableFormatter } from "../lib/table-formatter.js";

export class UsersCreateCommand extends BaseCommand {
  private userApiClient: UserApiClient;

  public constructor() {
    super();
    this.userApiClient = new UserApiClient();
  }

  public async execute(
    _args: string[],
    options: CommandOptions,
  ): Promise<void> {
    try {
      this.logger.info("👤 Creating user...");

      const userData = {
        firstName: String(options.firstName),
        lastName: String(options.lastName),
        email: String(options.email),
        role: String(options.role),
      };

      const user = await this.userApiClient.createUser(userData);

      this.logger.success("✅ User created successfully!");
      console.log(TableFormatter.formatUserTable([user]));
    } catch (error) {
      this.logger.error("❌ Failed to create user");
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
    }
  }
}
