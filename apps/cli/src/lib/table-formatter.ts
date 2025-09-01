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

  public static formatUserTable(users: Record<string, unknown>[]): string {
    const columns: TableColumn[] = [
      { key: "id", label: "ID", width: 6 },
      { key: "firstName", label: "First Name", width: 15 },
      { key: "lastName", label: "Last Name", width: 15 },
      { key: "email", label: "Email", width: 25 },
      { key: "role", label: "Role", width: 12 },
    ];

    return this.formatTable(users, columns);
  }
}
