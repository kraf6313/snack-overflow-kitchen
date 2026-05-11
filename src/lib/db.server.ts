import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.NEON_DATABASE_URL!);

export async function nextId(table: string, idCol: string): Promise<number> {
  const rows = await sql.query(
    `SELECT COALESCE(MAX(${idCol}), 0) + 1 AS next FROM ${table}`,
  ) as any[];
  return Number(rows[0].next);
}
