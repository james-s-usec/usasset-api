import { BaseCommand } from "./base-command.js";
import axios from "axios";
import {
  HTTP_TIMEOUT_MS,
  SEPARATOR_LENGTH,
  JSON_INDENT_SPACES,
  METHOD_NAME_PAD_LENGTH,
} from "../lib/constants.js";
import { ErrorHandler } from "../lib/error-handler.js";

interface OpenAPIParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: Record<string, unknown>;
}

interface OpenAPIRequestBody {
  content?: {
    [mediaType: string]: {
      schema?: Record<string, unknown>;
    };
  };
}

interface OpenAPIMethod {
  summary?: string;
  description?: string;
  parameters?: Array<OpenAPIParameter>;
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, unknown>;
}

interface OpenAPIPath {
  [method: string]: OpenAPIMethod;
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
    // Note: OpenAPI spec is at root, not under /api
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
    console.log("=".repeat(SEPARATOR_LENGTH));

    Object.entries(spec.paths).forEach(([path, methods]) => {
      console.log(`\n📍 ${path}`);
      Object.entries(methods).forEach(([method, details]) => {
        const summary = details.summary || "No description";
        console.log(
          `   ${method.toUpperCase().padEnd(METHOD_NAME_PAD_LENGTH)} - ${summary}`,
        );
      });
    });

    console.log("\n" + "=".repeat(SEPARATOR_LENGTH));
    console.log("\n💡 Tips:");
    console.log("   - Use 'api-docs detailed' for full documentation");
    console.log("   - Use 'api-docs json' for raw OpenAPI spec");
    console.log("   - Visit http://localhost:3000/api-docs for interactive UI");
  }

  private displayDetailed(spec: OpenAPISpec): void {
    console.log(`📖 ${spec.info.title} v${spec.info.version}`);
    console.log(`📝 ${spec.info.description}\n`);

    this.displayDetailedPaths(spec.paths);
    this.displayDetailedSchemas(spec.components?.schemas);
  }

  private displayDetailedPaths(paths: Record<string, OpenAPIPath>): void {
    Object.entries(paths).forEach(([path, methods]) => {
      console.log("\n" + "=".repeat(SEPARATOR_LENGTH));
      console.log(`📍 ${path}`);
      console.log("=".repeat(SEPARATOR_LENGTH));
      this.displayPathMethods(methods);
    });
  }

  private displayPathMethods(methods: OpenAPIPath): void {
    Object.entries(methods).forEach(([method, details]) => {
      console.log(`\n🔧 ${method.toUpperCase()}`);
      this.displayMethodDetails(details);
    });
  }

  private displayMethodDetails(details: any): void {
    if (details.summary) {
      console.log(`   Summary: ${details.summary}`);
    }
    if (details.description) {
      console.log(`   Description: ${details.description}`);
    }

    this.displayParameters(details.parameters);
    this.displayRequestBody(details.requestBody);
    this.displayResponses(details.responses);
  }

  private displayParameters(parameters?: Array<any>): void {
    if (!parameters || parameters.length === 0) return;

    console.log(`\n   📥 Parameters:`);
    parameters.forEach((param) => {
      const required = param.required ? " (required)" : " (optional)";
      console.log(`      - ${param.name} (${param.in})${required}`);
      if (param.schema) {
        console.log(`        Type: ${JSON.stringify(param.schema)}`);
      }
    });
  }

  private displayRequestBody(requestBody?: any): void {
    if (!requestBody?.content) return;

    console.log(`\n   📤 Request Body:`);
    Object.entries(requestBody.content).forEach(
      ([mediaType, content]: [string, any]) => {
        console.log(`      Content-Type: ${mediaType}`);
        if (content.schema) {
          const schemaStr = JSON.stringify(
            content.schema,
            null,
            JSON_INDENT_SPACES,
          );
          console.log(`      Schema: ${schemaStr.replace(/\n/g, "\n      ")}`);
        }
      },
    );
  }

  private displayResponses(responses?: Record<string, unknown>): void {
    if (!responses) return;

    console.log(`\n   📊 Responses:`);
    Object.entries(responses).forEach(([status, response]) => {
      console.log(`      ${status}: ${JSON.stringify(response)}`);
    });
  }

  private displayDetailedSchemas(schemas?: Record<string, unknown>): void {
    if (!schemas) return;

    console.log("\n\n" + "=".repeat(SEPARATOR_LENGTH));
    console.log("📋 Data Models");
    console.log("=".repeat(SEPARATOR_LENGTH));
    Object.entries(schemas).forEach(([name, schema]) => {
      console.log(`\n📦 ${name}`);
      console.log(JSON.stringify(schema, null, JSON_INDENT_SPACES));
    });
  }

  private displayUsage(): void {
    console.log("\nUsage: ./bin/usasset api-docs [format]");
    console.log("\nFormats:");
    console.log("  summary  - Show endpoint summary (default)");
    console.log("  detailed - Show full documentation");
    console.log("  json     - Output raw OpenAPI spec");
  }
}
