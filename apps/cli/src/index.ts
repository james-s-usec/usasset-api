#!/usr/bin/env node

import { Command } from "commander";
import { ProcessManager } from "./lib/process-manager.js";
import { HealthChecker } from "./lib/health-checker.js";
import { CliLogger } from "./lib/logger.js";
import { CommandFactory } from "./commands/command-factory.js";

const program = new Command();
const processManager = new ProcessManager();
const healthChecker = new HealthChecker();
const logger = new CliLogger();

program
  .name("usasset")
  .description("USAsset CLI for backend management")
  .version("0.0.1");

program
  .command("start")
  .description("Start the backend server")
  .action(async () => {
    logger.info("🚀 Starting USAsset backend...");

    if (processManager.isBackendRunning()) {
      logger.warn("⚠️  Backend is already running");
      return;
    }

    const result = processManager.spawnBackend(["npm", "run", "start:dev"]);

    if (result.started) {
      logger.info(`✅ Backend started with PID: ${result.pid}`);

      logger.info("🔍 Waiting for backend to be ready...");
      const isHealthy = await healthChecker.waitForHealth();

      if (isHealthy) {
        logger.success("🎉 Backend is ready and healthy!");
      } else {
        logger.error("❌ Backend failed to become healthy");
      }
    } else {
      logger.error("❌ Failed to start backend");
    }
  });

program
  .command("stop")
  .description("Stop the backend server")
  .action(() => {
    logger.info("🛑 Stopping USAsset backend...");

    const stopped = processManager.stopBackend();

    if (stopped) {
      logger.success("✅ Backend stopped successfully");
    } else {
      logger.warn("⚠️  No backend process found to stop");
    }
  });

program
  .command("health")
  .description("Check backend health status")
  .action(async () => {
    logger.info("🔍 Checking backend health...");

    const isHealthy = await healthChecker.checkHealth();

    if (isHealthy) {
      logger.success("✅ Backend is healthy");
    } else {
      logger.error("❌ Backend is not healthy");
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show backend process status")
  .action(() => {
    const isRunning = processManager.isBackendRunning();
    const pid = processManager.getBackendPid();

    if (isRunning && pid) {
      logger.info(`✅ Backend is running (PID: ${pid})`);
    } else {
      logger.info("⭕ Backend is not running");
    }
  });

program
  .command("cleanup")
  .description("Clean up processes using backend port")
  .option("-p, --port <number>", "Port to clean up", "3000")
  .action((options: { port: string }) => {
    const port = parseInt(options.port, 10);
    logger.info(`🧹 Cleaning up processes on port ${port}...`);

    const cleaned = processManager.cleanupPort(port);

    if (cleaned) {
      logger.success(`✅ Port ${port} is now available`);
    } else {
      logger.info(`ℹ️  Port ${port} was already available`);
    }
  });

// User management commands using factory pattern
const usersCommand = program
  .command("users")
  .description("User management operations");

usersCommand
  .command("list")
  .description("List all users")
  .option("-p, --page <number>", "Page number", "1")
  .option("-l, --limit <number>", "Items per page", "50")
  .action(async (options) => {
    const command = CommandFactory.createCommand("users:list");
    if (command) {
      await command.execute([], options as Record<string, unknown>);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("create")
  .description("Create a new user")
  .requiredOption("-e, --email <email>", "Email address")
  .option("-n, --name <name>", "User name")
  .option("-r, --role <role>", "User role (USER, ADMIN, SUPER_ADMIN)", "USER")
  .action(async (options) => {
    const command = CommandFactory.createCommand("users:create");
    if (command) {
      await command.execute([], options as Record<string, unknown>);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("get <id>")
  .description("Get a user by ID")
  .action(async (id: string) => {
    const command = CommandFactory.createCommand("users:get");
    if (command) {
      await command.execute([id]);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("update <id>")
  .description("Update a user by ID")
  .option("-e, --email <email>", "Email address")
  .option("-n, --name <name>", "User name")
  .option("-r, --role <role>", "User role (USER, ADMIN, SUPER_ADMIN)")
  .action(async (id: string, options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("users:update");
    if (command) {
      await command.execute([id], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("delete <id>")
  .description("Delete a user by ID")
  .option("-f, --force", "Skip confirmation")
  .action(async (id: string, options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("users:delete");
    if (command) {
      await command.execute([id], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("bulk-create")
  .description("Create multiple users from JSON file")
  .requiredOption("-f, --file <path>", "JSON file with users array")
  .action(async (options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("users:bulk-create");
    if (command) {
      await command.execute([], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("bulk-update")
  .description("Update multiple users from JSON file")
  .requiredOption("-f, --file <path>", "JSON file with updates array")
  .action(async (options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("users:bulk-update");
    if (command) {
      await command.execute([], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

usersCommand
  .command("bulk-delete")
  .description("Delete multiple users by IDs")
  .option("-i, --ids <ids>", "Comma-separated list of user IDs")
  .option("-f, --file <path>", "JSON file with IDs array")
  .option("--force", "Skip confirmation")
  .action(async (options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("users:bulk-delete");
    if (command) {
      await command.execute([], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

// Logs management commands
const logsCommand = program
  .command("logs")
  .description("View and manage application logs");

logsCommand
  .command("list")
  .description("List recent logs")
  .option("-p, --page <number>", "Page number", "1")
  .option("-l, --limit <number>", "Number of logs to show", "10")
  .option("--level <level>", "Filter by log level (ERROR, INFO, DEBUG, WARN)")
  .action(async (options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("logs:list");
    if (command) {
      await command.execute([], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

logsCommand
  .command("errors")
  .description("Show recent error logs")
  .option("-l, --limit <number>", "Number of errors to show", "10")
  .action(async (options: Record<string, unknown>) => {
    const command = CommandFactory.createCommand("logs:errors");
    if (command) {
      await command.execute([], options);
    } else {
      logger.error("❌ Command not found");
    }
  });

logsCommand
  .command("trace <correlationId>")
  .description("Trace a request by correlation ID")
  .action(async (correlationId: string) => {
    const command = CommandFactory.createCommand("logs:trace");
    if (command) {
      await command.execute([correlationId]);
    } else {
      logger.error("❌ Command not found");
    }
  });

// API Documentation command
program
  .command("api-docs [format]")
  .description("Display API documentation (summary, detailed, json)")
  .action(async (format: string = "summary") => {
    const command = CommandFactory.createCommand("api-docs");
    if (command) {
      await command.execute([format]);
    } else {
      logger.error("❌ Command not found");
    }
  });

// Database commands
const dbCommand = program
  .command("db")
  .description("Database inspection and management");

dbCommand
  .command("status")
  .description("Show database connection and overall status")
  .action(async () => {
    const command = CommandFactory.createCommand("db:status");
    if (command) {
      await command.execute([]);
    } else {
      logger.error("❌ Command not found");
    }
  });

dbCommand
  .command("tables")
  .description("List all database tables")
  .action(async () => {
    const command = CommandFactory.createCommand("db:tables");
    if (command) {
      await command.execute([]);
    } else {
      logger.error("❌ Command not found");
    }
  });

dbCommand
  .command("migrations")
  .description("Show recent database migrations")
  .action(async () => {
    const command = CommandFactory.createCommand("db:migrations");
    if (command) {
      await command.execute([]);
    } else {
      logger.error("❌ Command not found");
    }
  });

dbCommand
  .command("query <sql>")
  .description("Execute a SQL query")
  .action(async (sql: string) => {
    const command = CommandFactory.createCommand("db:query");
    if (command) {
      await command.execute([sql]);
    } else {
      logger.error("❌ Command not found");
    }
  });

program.parse();
