import axios, { AxiosResponse } from "axios";
import {
  DEFAULT_HEALTH_TIMEOUT_MS,
  HEALTH_CHECK_INTERVAL_MS,
  HTTP_TIMEOUT_MS,
} from "./constants";

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime?: number;
  environment?: string;
}

interface BackendHealthData {
  data?: HealthResponse;
  success?: boolean;
}

export class HealthChecker {
  private readonly baseUrl: string;

  public constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  public async checkHealth(): Promise<HealthResponse> {
    try {
      const response: AxiosResponse<BackendHealthData> = await axios.get(
        `${this.baseUrl}/health`,
        {
          timeout: HTTP_TIMEOUT_MS,
        },
      );

      const healthData = response.data.data ?? response.data;

      return healthData as HealthResponse;
    } catch {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async waitForHealth(
    timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const health = await this.checkHealth();
        if (health.status === "ok") {
          return true;
        }
      } catch {
        // Continue waiting
      }

      // Wait before next check
      await new Promise<void>((resolve): void => {
        setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS);
      });
    }

    return false;
  }
}
