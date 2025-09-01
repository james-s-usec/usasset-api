import { spawn } from "cross-spawn";
import type { ChildProcess } from "node:child_process";
import { join } from "path";

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
    const backendPath = join(process.cwd(), "apps/backend");

    const childProcess = spawn(command[0], command.slice(1), {
      cwd: backendPath,
      stdio: "inherit",
      detached: false,
    });

    const pid = childProcess.pid || 0;
    this.processes.set("backend", childProcess);

    return {
      pid,
      process: childProcess,
      started: pid > 0,
    };
  }

  public stopBackend(): boolean {
    const backendProcess: ChildProcess | undefined =
      this.processes.get("backend");
    if (backendProcess === undefined) {
      return false;
    }

    // Send SIGTERM for graceful shutdown (learned from Step 1)
    const killed: boolean = backendProcess.kill("SIGTERM");
    this.processes.delete("backend");

    return killed;
  }

  public getBackendPid(): number | undefined {
    const backendProcess: ChildProcess | undefined =
      this.processes.get("backend");
    if (backendProcess === undefined) {
      return undefined;
    }
    return backendProcess.pid;
  }

  public isBackendRunning(): boolean {
    const backendProcess: ChildProcess | undefined =
      this.processes.get("backend");
    if (backendProcess === undefined) {
      return false;
    }
    return !backendProcess.killed;
  }
}
