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
  .requiredOption("-f, --first-name <firstName>", "First name")
  .requiredOption("-l, --last-name <lastName>", "Last name")
  .requiredOption("-e, --email <email>", "Email address")
  .requiredOption("-r, --role <role>", "User role")
  .action(async (options) => {
    const command = CommandFactory.createCommand("users:create");
    if (command) {
      await command.execute([], options as Record<string, unknown>);
    } else {
      logger.error("❌ Command not found");
    }
  });

program.parse();
