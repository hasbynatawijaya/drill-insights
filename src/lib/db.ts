import { asset } from '$app/paths';
import * as duckdb from '@duckdb/duckdb-wasm';

let connection: Promise<duckdb.AsyncDuckDBConnection> | undefined;

async function connect() {
	// The engine is 36 MB, too big for most static hosts, and the CDN serves it compressed.
	const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
	// A worker can't start from another origin directly, so a same-origin blob imports it.
	const workerUrl = URL.createObjectURL(
		new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
	);
	const worker = new Worker(workerUrl);
	const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
	URL.revokeObjectURL(workerUrl);

	const dataUrl =
		import.meta.env.VITE_DATA_URL ?? new URL(asset('data/events.parquet'), location.origin).href;
	await db.registerFileURL('events.parquet', dataUrl, duckdb.DuckDBDataProtocol.HTTP, false);

	const conn = await db.connect();
	await conn.query(`CREATE VIEW events AS SELECT * FROM read_parquet('events.parquet')`);
	return conn;
}

export type Timed<T> = { rows: T[]; ms: number };

export async function query<T>(sql: string): Promise<Timed<T>> {
	connection ??= connect();
	const conn = await connection;
	const started = performance.now();
	const table = await conn.query(sql);
	return {
		rows: table.toArray().map((row) => row.toJSON() as T),
		ms: performance.now() - started
	};
}
