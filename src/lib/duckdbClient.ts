import type {
  WorkerRequest,
  WorkerResponse,
  ColumnInfo,
  ColumnProfile,
} from "./workerTypes";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  onProgress?: (done: number, total: number, column: ColumnProfile) => void;
};

let idCounter = 0;
function nextId(): string {
  return `req-${++idCounter}-${Date.now()}`;
}

export class DuckDBClient {
  private worker: Worker;
  private pending = new Map<string, PendingRequest>();
  private queue: (() => void)[] = [];
  private running = false;

  constructor() {
    this.worker = new Worker(
      new URL("../workers/duckdb.worker.ts", import.meta.url),
      { type: "module" }
    );
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleMessage(e.data);
    };
  }

  private handleMessage(msg: WorkerResponse) {
    if (msg.type === "profile:progress") {
      const req = this.pending.get(msg.id);
      if (req?.onProgress) {
        req.onProgress(msg.done, msg.total, msg.column);
      }
      return;
    }

    const req = this.pending.get(msg.id);
    if (!req) return;
    this.pending.delete(msg.id);

    if (msg.type === "error") {
      req.reject(new Error(msg.message));
    } else {
      req.resolve(msg);
    }
  }

  private send<T>(
    request: Record<string, unknown>,
    onProgress?: PendingRequest["onProgress"]
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = () => {
        const id = nextId();
        this.pending.set(id, {
          resolve: (val) => {
            resolve(val as T);
            this.running = false;
            this.drain();
          },
          reject: (err) => {
            reject(err);
            this.running = false;
            this.drain();
          },
          onProgress,
        });
        this.worker.postMessage({ ...request, id } as WorkerRequest);
      };

      if (this.running) {
        this.queue.push(execute);
      } else {
        this.running = true;
        execute();
      }
    });
  }

  private drain() {
    const next = this.queue.shift();
    if (next) {
      this.running = true;
      next();
    }
  }

  async init(): Promise<void> {
    await this.send<{ type: "init"; ok: true }>({ type: "init" });
  }

  async loadParquet(
    buffer: ArrayBuffer,
    fileName: string,
    fileSize: number
  ): Promise<void> {
    await this.send<{ type: "loadParquet"; ok: true }>({
      type: "loadParquet",
      buffer,
      fileName,
      fileSize,
    });
  }

  async query(
    sql: string
  ): Promise<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
  }> {
    const res = await this.send<{
      type: "query";
      ok: true;
      columns: string[];
      rows: Record<string, unknown>[];
      rowCount: number;
    }>({ type: "query", sql });
    return { columns: res.columns, rows: res.rows, rowCount: res.rowCount };
  }

  async describe(): Promise<ColumnInfo[]> {
    const res = await this.send<{ type: "describe"; ok: true; columns: ColumnInfo[] }>({
      type: "describe",
    });
    return res.columns;
  }

  async profile(
    onProgress: (done: number, total: number, column: ColumnProfile) => void
  ): Promise<{ rowCount: number; columns: ColumnProfile[] }> {
    const res = await this.send<{
      type: "profile:complete";
      ok: true;
      rowCount: number;
      columns: ColumnProfile[];
    }>({ type: "profile" }, onProgress);
    return { rowCount: res.rowCount, columns: res.columns };
  }

  terminate() {
    this.worker.terminate();
  }
}
