export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const parseCSV = (content: string, maxRows: number = 100): ParsedCSV => {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Simple CSV parsing (handles basic cases, not escaped commas)
  const parseRow = (line: string): string[] => {
    return line.split(',').map(cell => cell.trim());
  };

  const headers = parseRow(lines[0]);
  const dataLines = lines.slice(1, maxRows + 1);
  const rows = dataLines.map(line => parseRow(line));

  return {
    headers,
    rows,
    totalRows: lines.length - 1, // Exclude header
  };
};