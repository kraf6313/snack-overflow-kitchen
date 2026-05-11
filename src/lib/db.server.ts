import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.NEON_DATABASE_URL!);

export async function nextId(table: string, idCol: string): Promise<number> {
  const rows = await sql(
    `SELECT COALESCE(MAX(${idCol}), 0) + 1 AS next FROM ${table}`,
  );
  return Number((rows as any[])[0].next);
}
