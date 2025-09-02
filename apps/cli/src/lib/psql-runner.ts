import { spawn } from "cross-spawn";
import type { ChildProcess } from "node:child_process";

export class PsqlRunner {
  public static async runQuery(query: string, title: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const psql = PsqlRunner.createPsqlProcess(query);
      const output = PsqlRunner.setupOutputCapture(psql);

      PsqlRunner.handleProcessCompletion(psql, output, title, {
        resolve,
        reject,
      });
      PsqlRunner.handleProcessError(psql, reject);
    });
  }

  private static createPsqlProcess(query: string): ChildProcess {
    return spawn(
      "psql",
      [
        "-h",
        "localhost",
        "-p",
        "5433",
        "-U",
        "dbadmin",
        "-d",
        "usasset",
        "-c",
        query,
      ],
      {
        env: { ...process.env, PGPASSWORD: "localpassword123" },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  }

  private static setupOutputCapture(psql: ChildProcess): {
    stdout: string;
    stderr: string;
  } {
    const output = { stdout: "", stderr: "" };

    psql.stdout?.on("data", (data: Buffer) => {
      output.stdout += data.toString();
    });

    psql.stderr?.on("data", (data: Buffer) => {
      output.stderr += data.toString();
    });

    return output;
  }

  private static handleProcessCompletion(
    psql: ChildProcess,
    output: { stdout: string; stderr: string },
    title: string,
    callbacks: { resolve: () => void; reject: (error: Error) => void },
  ): void {
    psql.on("close", (code: number) => {
      if (code === 0) {
        console.log(`📊 ${title}:`);
        console.log(output.stdout);
        callbacks.resolve();
      } else {
        console.error(`❌ ${title} failed:`);
        console.error(output.stderr);
        callbacks.reject(new Error(`psql command failed with code ${code}`));
      }
    });
  }

  private static handleProcessError(
    psql: ChildProcess,
    reject: (error: Error) => void,
  ): void {
    psql.on("error", (error: Error) => {
      reject(error);
    });
  }
}
