import { spawn } from "cross-spawn";
import type { ChildProcess } from "node:child_process";
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

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map<
    string,
    ChildProcess
  >();

  public spawnBackend(command: string[]): ProcessResult {
    // Go up two levels from CLI bin to get to project root
    const cliPath = dirname(dirname(dirname(process.argv[1])));
    const projectRoot = dirname(dirname(cliPath));
    const backendPath = join(projectRoot, "apps/backend");

    // Use npx to run npm scripts properly
    const childProcess = spawn("npx", ["--no-install", ...command], {
      cwd: backendPath,
      stdio: "inherit",
      detached: false,
      env: { ...process.env },
    });

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
      // Send SIGTERM for graceful shutdown (learned from Step 1)
      process.kill(pid, "SIGTERM");
      this.deletePidFile();
      this.processes.delete("backend");
      return true;
    } catch {
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
      // process.kill(pid, 0) throws if process doesn't exist
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
