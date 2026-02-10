import type { Stay } from "./rule90-180";

const CSV_HEADER = "country,entryDate,exitDate";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return !isNaN(d.getTime());
}

function parseRow(
  row: string,
  index: number
): { stay: Stay } | { error: string } {
  const cells = row.split(",").map((c) => c.trim());
  if (cells.length < 3) {
    return { error: `Row ${index + 1}: expected 3 columns (country, entryDate, exitDate)` };
  }
  const [country, entryDate, exitDate] = cells;
  if (!country) {
    return { error: `Row ${index + 1}: country is empty` };
  }
  if (!isValidDate(entryDate)) {
    return { error: `Row ${index + 1}: invalid entryDate "${entryDate}"` };
  }
  if (!isValidDate(exitDate)) {
    return { error: `Row ${index + 1}: invalid exitDate "${exitDate}"` };
  }
  const entry = new Date(entryDate + "T12:00:00");
  const exit = new Date(exitDate + "T12:00:00");
  if (exit < entry) {
    return { error: `Row ${index + 1}: exitDate must be on or after entryDate` };
  }
  const stay: Stay = {
    id: crypto.randomUUID(),
    country,
    entryDate,
    exitDate,
  };
  return { stay };
}

/**
 * Export stays to CSV string with header.
 */
export function staysToCsv(stays: Stay[]): string {
  const lines = [CSV_HEADER, ...stays.map((s) => `${s.country},${s.entryDate},${s.exitDate}`)];
  return lines.join("\n");
}

/**
 * Parse CSV text to stays. Accepts with or without header.
 * Returns valid stays and a list of errors for invalid rows.
 */
export function parseCsvToStays(csvText: string): { stays: Stay[]; errors: string[] } {
  const stays: Stay[] = [];
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const startIndex = lines.length > 0 && lines[0].toLowerCase().startsWith("country") ? 1 : 0;
  for (let i = startIndex; i < lines.length; i++) {
    const result = parseRow(lines[i], i);
    if ("error" in result) errors.push(result.error);
    else stays.push(result.stay);
  }
  return { stays, errors };
}
