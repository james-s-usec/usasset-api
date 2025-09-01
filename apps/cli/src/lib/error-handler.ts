import { CliLogger } from "./logger.js";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  success: boolean;
  error?: {
    code?: string;
    message?: string | string[];
    details?: string;
    statusCode?: number;
  };
  correlationId?: string;
  timestamp?: string;
}

export class ErrorHandler {
  private static logger = new CliLogger();

  public static handleApiError(error: unknown, operation: string): void {
    this.logger.error(`❌ Failed to ${operation}`);

    if (this.isAxiosError(error)) {
      if (error.response) {
        this.handleServerError(error);
      } else if (error.request) {
        this.handleConnectionError();
      } else {
        this.logger.error(error.message);
      }
    } else if (error instanceof Error) {
      this.logger.error(error.message);
    } else {
      this.logger.error("Unknown error occurred");
    }
  }

  private static handleServerError(error: AxiosError<ApiErrorResponse>): void {
    const errorData = error.response?.data;

    if (errorData?.error?.message) {
      if (Array.isArray(errorData.error.message)) {
        this.logger.error("Validation errors:");
        errorData.error.message.forEach((msg: string) => {
          this.logger.error(`   • ${msg}`);
        });
      } else {
        this.logger.error(errorData.error.message);
      }
    } else if (error.response) {
      this.logger.error(
        `Server error: ${error.response.status} ${error.response.statusText}`,
      );
    }
  }

  private static handleConnectionError(): void {
    this.logger.error("Cannot connect to backend. Is it running?");
    this.logger.error("Try: ./bin/usasset start");
  }

  private static isAxiosError(
    error: unknown,
  ): error is AxiosError<ApiErrorResponse> {
    return (error as AxiosError).isAxiosError === true;
  }
}
