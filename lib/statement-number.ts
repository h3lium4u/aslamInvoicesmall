import { prisma } from "./prisma";

/**
 * Generates a statement number in the format WI-YYYY-MM-XXXX
 * Sequence is per month/year. Uses a DB query to determine next seq.
 */
export async function generateStatementNumber(
  month: number,
  year: number
): Promise<string> {
  const count = await prisma.statement.count({ where: { month, year } });
  const seq = count + 1;
  return `WI-${year}-${String(month).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;
}

export const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "Unknown";
}
