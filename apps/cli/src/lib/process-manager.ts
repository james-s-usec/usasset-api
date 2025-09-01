import { spawn } from "cross-spawn";
import type { ChildProcess } from "node:child_process";
import { execSync } from "node:child_process";
import { join, dirname } from "path";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { PID_FILE_NAME } from "./constants.js";

export interface ProcessOptions {
  command: string[];
  cwd: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ProcessResult {
  pid: number;
  process: ChildProcess;
  started: boolean;
}

interface SpawnError extends Error {
  code?: string;
  path?: string;
}

const DEFAULT_PORT = 3000;

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map<
    string,
    ChildProcess
  >();

  private calculateBackendPath(): string {
    const binPath = dirname(process.argv[1]);
    const cliPath = dirname(binPath);
    const appsPath = dirname(cliPath);
    const projectRoot = dirname(appsPath);
    return join(projectRoot, "apps/backend");
  }

  private validateBackendPath(backendPath: string): void {
    if (!existsSync(backendPath)) {
      console.error("❌ Backend directory not found!");
      console.error("   Expected path:", backendPath);
      console.error("   Current working directory:", process.cwd());
      console.error("   CLI binary location:", process.argv[1]);
      console.error(
        "   Hint: Check if you are running from the correct location",
      );
      throw new Error(`Backend directory does not exist: ${backendPath}`);
    }

    const packageJsonPath = join(backendPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      console.error("❌ Backend package.json not found!");
      console.error("   Expected at:", packageJsonPath);
      throw new Error(`Not a valid backend directory: ${backendPath}`);
    }
  }

  private setupErrorHandling(
    childProcess: ChildProcess,
    commandString: string,
    backendPath: string,
  ): void {
    childProcess.on("error", (error: SpawnError) => {
      console.error("❌ Failed to spawn backend process");
      console.error("   Command:", commandString);
      console.error("   Working directory:", backendPath);
      console.error("   Error:", error.message);

      if (error.code === "ENOENT") {
        if (error.path === "npm") {
          console.error("   Hint: npm not found. Is Node.js installed?");
          console.error("   Try: which npm");
        } else if (error.path?.includes("sh")) {
          console.error(
            "   Hint: Shell not found. This may be a WSL/Windows issue.",
          );
          console.error("   Shell path:", error.path);
        }
      }
    });
  }

  private setupPortConflictDetection(childProcess: ChildProcess): void {
    if (childProcess.stderr) {
      childProcess.stderr.on("data", (data: Buffer) => {
        const output = data.toString();
        if (output.includes("EADDRINUSE")) {
          const portMatch = output.match(/:(\d+)/);
          const port = portMatch ? portMatch[1] : String(DEFAULT_PORT);
          console.error(`\n❌ Port ${port} is already in use!`);
          console.error("   Another process is using this port.");
          console.error("   Options:");
          console.error(
            "   1. Stop the other process: lsof -i :" + port + " | grep LISTEN",
          );
          console.error(
            "   2. Use a different port: PORT=3001 npm run start:dev",
          );
          console.error("   3. Force cleanup: ./bin/usasset cleanup\n");
        }
      });
    }
  }

  public spawnBackend(command: string[]): ProcessResult {
    const backendPath = this.calculateBackendPath();
    this.validateBackendPath(backendPath);

    const commandString = command.join(" ");
    const childProcess = spawn(commandString, {
      cwd: backendPath,
      stdio: "inherit",
      detached: false,
      shell: true,
      env: process.env,
    });

    this.setupErrorHandling(childProcess, commandString, backendPath);
    this.setupPortConflictDetection(childProcess);

    const pid = childProcess.pid || 0;
    this.processes.set("backend", childProcess);

    if (pid > 0) {
      this.writePidFile(pid);
    }

    return {
      pid,
      process: childProcess,
      started: pid > 0,
    };
  }

  public stopBackend(): boolean {
    const pid = this.readPidFile();
    if (pid === undefined || !this.isProcessRunning(pid)) {
      return false;
    }

    try {
      process.kill(pid, "SIGTERM");
      this.deletePidFile();
      this.processes.delete("backend");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("   Error stopping process:", errorMessage);
      return false;
    }
  }

  private killProcesses(pids: string[]): void {
    for (const pid of pids) {
      try {
        process.kill(parseInt(pid, 10), "SIGTERM");
        console.log(`   Stopped process ${pid}`);
      } catch {
        console.log(`   Process ${pid} already stopped`);
      }
    }
  }

  public cleanupPort(port = DEFAULT_PORT): boolean {
    try {
      const result = execSync(`lsof -i :${port} -t 2>/dev/null || true`, {
        encoding: "utf8",
      });
      const pids = result.trim().split("\n").filter(Boolean);

      if (pids.length === 0) {
        return false;
      }

      console.log(`Found ${pids.length} process(es) using port ${port}`);
      this.killProcesses(pids);
      this.deletePidFile();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error during cleanup:", errorMessage);
      return false;
    }
  }

  public getBackendPid(): number | undefined {
    return this.readPidFile();
  }

  public isBackendRunning(): boolean {
    const pid = this.readPidFile();
    return pid !== undefined && this.isProcessRunning(pid);
  }

  private writePidFile(pid: number): void {
    try {
      writeFileSync(PID_FILE_NAME, pid.toString(), { encoding: "utf8" });
    } catch {
      // Silently fail - PID tracking is nice-to-have
    }
  }

  private readPidFile(): number | undefined {
    try {
      if (!existsSync(PID_FILE_NAME)) {
        return undefined;
      }
      const pidStr = readFileSync(PID_FILE_NAME, { encoding: "utf8" });
      const pid = parseInt(pidStr.trim(), 10);
      return isNaN(pid) ? undefined : pid;
    } catch {
      return undefined;
    }
  }

  private deletePidFile(): void {
    try {
      if (existsSync(PID_FILE_NAME)) {
        unlinkSync(PID_FILE_NAME);
      }
    } catch {
      // Silently fail - cleanup is nice-to-have
    }
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
