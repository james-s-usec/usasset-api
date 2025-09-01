export interface TableColumn {
  key: string;
  label: string;
  width: number;
}

export class TableFormatter {
  private static formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    return JSON.stringify(value);
  }

  public static formatTable(
    data: Record<string, unknown>[],
    columns: TableColumn[],
  ): string {
    if (data.length === 0) {
      return "No data found.";
    }

    const lines: string[] = [];
    const headerLine = columns
      .map((col) => col.label.padEnd(col.width))
      .join(" | ");
    const separatorLine = columns
      .map((col) => "-".repeat(col.width))
      .join("-+-");

    lines.push(headerLine, separatorLine);

    for (const row of data) {
      const dataLine = columns
        .map((col) => this.formatCellValue(row[col.key]).padEnd(col.width))
        .join(" | ");
      lines.push(dataLine);
    }

    return lines.join("\n");
  }

  private static formatId(value: unknown): string {
    const ID_LENGTH = 8;
    if (value === undefined || value === null) return "";
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value).substring(0, ID_LENGTH) + "...";
  }

  private static formatDate(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string" && typeof value !== "number") return "";
    const dateValue = new Date(String(value));
    return isNaN(dateValue.getTime()) ? "" : dateValue.toLocaleDateString();
  }

  public static formatUserTable(users: Record<string, unknown>[]): string {
    const columns: TableColumn[] = [
      { key: "id", label: "ID", width: 12 },
      { key: "name", label: "Name", width: 20 },
      { key: "email", label: "Email", width: 30 },
      { key: "role", label: "Role", width: 12 },
      { key: "created_at", label: "Created", width: 12 },
    ];

    const transformedUsers = users.map((user) => ({
      ...user,
      id: this.formatId(user.id),
      created_at: this.formatDate(user.created_at),
    }));

    return this.formatTable(transformedUsers, columns);
  }
}
