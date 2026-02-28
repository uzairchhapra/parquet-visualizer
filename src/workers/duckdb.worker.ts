import * as duckdb from "@duckdb/duckdb-wasm";
import type { WorkerRequest, WorkerResponse, ColumnInfo, ColumnProfile } from "../lib/workerTypes";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function initDuckDB() {
  const DUCKDB_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  const logger = new duckdb.ConsoleLogger();
  const worker = await duckdb.createWorker(bundle.mainWorker!);
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  conn = await db.connect();
}

async function loadParquet(buffer: ArrayBuffer) {
  if (!db || !conn) throw new Error("DuckDB not initialized");
  const bytes = new Uint8Array(buffer);
  await db.registerFileBuffer("/data.parquet", bytes);
  await conn.query(
    "CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('/data.parquet')"
  );
}

async function runQuery(sql: string) {
  if (!conn) throw new Error("DuckDB not initialized");
  const result = await conn.query(sql);
  const columns = result.schema.fields.map((f) => f.name);
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < result.numRows; i++) {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const vec = result.getChild(col);
      const val = vec?.get(i);
      // Convert BigInt to number for JSON compatibility
      row[col] = typeof val === "bigint" ? Number(val) : val;
    }
    rows.push(row);
  }
  return { columns, rows, rowCount: result.numRows };
}

async function describe(): Promise<ColumnInfo[]> {
  if (!conn) throw new Error("DuckDB not initialized");
  const result = await conn.query("DESCRIBE data");
  const columns: ColumnInfo[] = [];
  for (let i = 0; i < result.numRows; i++) {
    columns.push({
      name: String(result.getChild("column_name")?.get(i) ?? ""),
      type: String(result.getChild("column_type")?.get(i) ?? ""),
      nullable: String(result.getChild("null")?.get(i) ?? "YES") === "YES",
    });
  }
  return columns;
}

function isNumericType(t: string): boolean {
  const lower = t.toLowerCase();
  return (
    lower.includes("int") ||
    lower.includes("float") ||
    lower.includes("double") ||
    lower.includes("decimal") ||
    lower.includes("numeric") ||
    lower.includes("real") ||
    lower === "hugeint" ||
    lower === "ubigint" ||
    lower === "uinteger" ||
    lower === "usmallint" ||
    lower === "utinyint"
  );
}

async function profile(requestId: string) {
  if (!conn) throw new Error("DuckDB not initialized");

  const countResult = await conn.query("SELECT COUNT(*)::INTEGER as cnt FROM data");
  const rowCount = Number(countResult.getChild("cnt")?.get(0) ?? 0);

  const cols = await describe();
  const profiles: ColumnProfile[] = [];

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const escaped = `"${col.name.replace(/"/g, '""')}"`;

    try {
      const statsSQL = `
        SELECT
          COUNT(*) - COUNT(${escaped}) AS null_count,
          ROUND((COUNT(*) - COUNT(${escaped}))::DOUBLE / GREATEST(COUNT(*), 1) * 100, 2) AS null_pct,
          COUNT(DISTINCT ${escaped})::INTEGER AS distinct_count
        FROM data
      `;
      const statsResult = await conn.query(statsSQL);
      const nullCount = Number(statsResult.getChild("null_count")?.get(0) ?? 0);
      const nullPercent = Number(statsResult.getChild("null_pct")?.get(0) ?? 0);
      const distinctCount = Number(statsResult.getChild("distinct_count")?.get(0) ?? 0);

      let min: string | number | null = null;
      let max: string | number | null = null;
      let topValues: { value: string; count: number }[] | undefined;

      if (isNumericType(col.type)) {
        const minMaxSQL = `SELECT MIN(${escaped}) as mn, MAX(${escaped}) as mx FROM data`;
        const mmResult = await conn.query(minMaxSQL);
        const mnVal = mmResult.getChild("mn")?.get(0);
        const mxVal = mmResult.getChild("mx")?.get(0);
        min = mnVal != null ? (typeof mnVal === "bigint" ? Number(mnVal) : mnVal) : null;
        max = mxVal != null ? (typeof mxVal === "bigint" ? Number(mxVal) : mxVal) : null;
      } else {
        const topSQL = `
          SELECT ${escaped}::VARCHAR AS val, COUNT(*)::INTEGER AS cnt
          FROM data
          WHERE ${escaped} IS NOT NULL
          GROUP BY ${escaped}
          ORDER BY cnt DESC
          LIMIT 20
        `;
        const topResult = await conn.query(topSQL);
        topValues = [];
        for (let j = 0; j < topResult.numRows; j++) {
          topValues.push({
            value: String(topResult.getChild("val")?.get(j) ?? ""),
            count: Number(topResult.getChild("cnt")?.get(j) ?? 0),
          });
        }
      }

      const profile: ColumnProfile = {
        name: col.name,
        type: col.type,
        nullCount,
        nullPercent,
        distinctCount,
        min,
        max,
        topValues,
      };
      profiles.push(profile);

      post({
        type: "profile:progress",
        id: requestId,
        done: i + 1,
        total: cols.length,
        column: profile,
      });
    } catch (_err) {
      const profile: ColumnProfile = {
        name: col.name,
        type: col.type,
        nullCount: -1,
        nullPercent: -1,
        distinctCount: -1,
      };
      profiles.push(profile);
      post({
        type: "profile:progress",
        id: requestId,
        done: i + 1,
        total: cols.length,
        column: profile,
      });
    }
  }

  return { rowCount, columns: profiles };
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case "init":
        await initDuckDB();
        post({ type: "init", id: msg.id, ok: true });
        break;
      case "loadParquet":
        await loadParquet(msg.buffer);
        post({ type: "loadParquet", id: msg.id, ok: true });
        break;
      case "query": {
        const result = await runQuery(msg.sql);
        post({ type: "query", id: msg.id, ok: true, ...result });
        break;
      }
      case "describe": {
        const columns = await describe();
        post({ type: "describe", id: msg.id, ok: true, columns });
        break;
      }
      case "profile": {
        const result = await profile(msg.id);
        post({ type: "profile:complete", id: msg.id, ok: true, ...result });
        break;
      }
    }
  } catch (err) {
    post({
      type: "error",
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
