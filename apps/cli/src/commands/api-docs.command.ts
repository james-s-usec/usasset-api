import { BaseCommand } from "./base-command.js";
import axios from "axios";
import { DEFAULT_API_BASE_URL, HTTP_TIMEOUT_MS } from "../lib/constants.js";
import { ErrorHandler } from "../lib/error-handler.js";

interface OpenAPIPath {
  [method: string]: {
    summary?: string;
    description?: string;
    parameters?: Array<{
      name: string;
      in: string;
      required?: boolean;
      schema?: Record<string, unknown>;
    }>;
    requestBody?: {
      content?: {
        [mediaType: string]: {
          schema?: Record<string, unknown>;
        };
      };
    };
    responses?: Record<string, unknown>;
  };
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  paths: Record<string, OpenAPIPath>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

export class ApiDocsCommand extends BaseCommand {
  public async execute(args: string[]): Promise<void> {
    const format = args[0] || "summary";

    try {
      this.logger.info("📚 Fetching API documentation...\n");
      const spec = await this.fetchOpenAPISpec();

      switch (format) {
        case "summary":
          this.displaySummary(spec);
          break;
        case "detailed":
          this.displayDetailed(spec);
          break;
        case "json":
          console.log(JSON.stringify(spec, null, 2));
          break;
        default:
          this.logger.error(`❌ Unknown format: ${format}`);
          this.displayUsage();
      }
    } catch (error) {
      ErrorHandler.handleApiError(error, "fetch API documentation");
    }
  }

  private async fetchOpenAPISpec(): Promise<OpenAPISpec> {
    const response = await axios.get<OpenAPISpec>(
      "http://localhost:3000/api-docs-json",
      { timeout: HTTP_TIMEOUT_MS },
    );
    return response.data;
  }

  private displaySummary(spec: OpenAPISpec): void {
    console.log(`📖 ${spec.info.title} v${spec.info.version}`);
    console.log(`📝 ${spec.info.description}\n`);

    console.log("🔗 Available Endpoints:");
    console.log("=".repeat(80));

    Object.entries(spec.paths).forEach(([path, methods]) => {
      console.log(`\n📍 ${path}`);
      Object.entries(methods).forEach(([method, details]) => {
        const summary = details.summary || "No description";
        console.log(`   ${method.toUpperCase().padEnd(7)} - ${summary}`);
      });
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n💡 Tips:");
    console.log("   - Use 'api-docs detailed' for full documentation");
    console.log("   - Use 'api-docs json' for raw OpenAPI spec");
    console.log("   - Visit http://localhost:3000/api-docs for interactive UI");
  }

  private displayDetailed(spec: OpenAPISpec): void {
    console.log(`📖 ${spec.info.title} v${spec.info.version}`);
    console.log(`📝 ${spec.info.description}\n`);

    Object.entries(spec.paths).forEach(([path, methods]) => {
      console.log("\n" + "=".repeat(80));
      console.log(`📍 ${path}`);
      console.log("=".repeat(80));

      Object.entries(methods).forEach(([method, details]) => {
        console.log(`\n🔧 ${method.toUpperCase()}`);
        if (details.summary) {
          console.log(`   Summary: ${details.summary}`);
        }
        if (details.description) {
          console.log(`   Description: ${details.description}`);
        }

        if (details.parameters && details.parameters.length > 0) {
          console.log(`\n   📥 Parameters:`);
          details.parameters.forEach((param) => {
            const required = param.required ? " (required)" : " (optional)";
            console.log(`      - ${param.name} (${param.in})${required}`);
            if (param.schema) {
              console.log(`        Type: ${JSON.stringify(param.schema)}`);
            }
          });
        }

        if (details.requestBody?.content) {
          console.log(`\n   📤 Request Body:`);
          Object.entries(details.requestBody.content).forEach(
            ([mediaType, content]) => {
              console.log(`      Content-Type: ${mediaType}`);
              if (content.schema) {
                console.log(
                  `      Schema: ${JSON.stringify(content.schema, null, 2).replace(/\n/g, "\n      ")}`,
                );
              }
            },
          );
        }

        if (details.responses) {
          console.log(`\n   📊 Responses:`);
          Object.entries(details.responses).forEach(([status, response]) => {
            console.log(`      ${status}: ${JSON.stringify(response)}`);
          });
        }
      });
    });

    if (spec.components?.schemas) {
      console.log("\n\n" + "=".repeat(80));
      console.log("📋 Data Models");
      console.log("=".repeat(80));
      Object.entries(spec.components.schemas).forEach(([name, schema]) => {
        console.log(`\n📦 ${name}`);
        console.log(JSON.stringify(schema, null, 2));
      });
    }
  }

  private displayUsage(): void {
    console.log("\nUsage: ./bin/usasset api-docs [format]");
    console.log("\nFormats:");
    console.log("  summary  - Show endpoint summary (default)");
    console.log("  detailed - Show full documentation");
    console.log("  json     - Output raw OpenAPI spec");
  }
}
