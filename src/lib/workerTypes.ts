/** Messages sent from main thread to worker */
export type WorkerRequest =
  | { type: "init"; id: string }
  | { type: "loadParquet"; id: string; buffer: ArrayBuffer; fileName: string; fileSize: number }
  | { type: "query"; id: string; sql: string }
  | { type: "describe"; id: string }
  | { type: "profile"; id: string };

/** Column schema info */
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

/** Profile result for a single column */
export interface ColumnProfile {
  name: string;
  type: string;
  nullCount: number;
  nullPercent: number;
  distinctCount: number;
  min?: string | number | null;
  max?: string | number | null;
  topValues?: { value: string; count: number }[];
}

/** Messages sent from worker to main thread */
export type WorkerResponse =
  | { type: "init"; id: string; ok: true }
  | { type: "loadParquet"; id: string; ok: true }
  | { type: "query"; id: string; ok: true; columns: string[]; rows: Record<string, unknown>[]; rowCount: number }
  | { type: "describe"; id: string; ok: true; columns: ColumnInfo[] }
  | { type: "profile:progress"; id: string; done: number; total: number; column: ColumnProfile }
  | { type: "profile:complete"; id: string; ok: true; rowCount: number; columns: ColumnProfile[] }
  | { type: "error"; id: string; message: string };
