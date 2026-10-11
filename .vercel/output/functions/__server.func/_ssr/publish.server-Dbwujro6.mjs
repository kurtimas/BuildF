import { b as sanitizeLayout } from "./data-DgpBTTGj.mjs";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/publish.server-Dbwujro6.js
var _0001_yard_floor_default = "create table if not exists yard_floor (\n  id integer primary key check (id = 1),\n  layout jsonb not null,\n  password_hash text,\n  updated_at timestamptz not null default now()\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("@electric-sql/pglite");
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0001_yard_floor.sql": _0001_yard_floor_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var scryptAsync = promisify(scrypt);
var MIN_PASSWORD = 4;
var attempts = {
	fails: 0,
	lockedUntil: 0
};
function envPassword() {
	return process.env.YARD_SAVE_PASSWORD?.trim() || void 0;
}
function sameSecret(a, b) {
	const left = createHash("sha256").update(a).digest();
	const right = createHash("sha256").update(b).digest();
	return timingSafeEqual(left, right);
}
async function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	return `scrypt$${salt}$${(await scryptAsync(password, salt, 32)).toString("hex")}`;
}
async function matchesHash(password, stored) {
	const [scheme, salt, hex] = stored.split("$");
	if (scheme !== "scrypt" || !salt || !hex) return false;
	const derived = await scryptAsync(password, salt, 32);
	const expected = Buffer.from(hex, "hex");
	if (derived.length !== expected.length) return false;
	return timingSafeEqual(derived, expected);
}
function asLayout(value) {
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return null;
	}
	return value;
}
async function readPublished() {
	const row = (await (await getSql())`
    select layout, password_hash, updated_at::text as updated_at
    from yard_floor
    where id = 1
  `)[0];
	const layout = row ? asLayout(row.layout) : null;
	return {
		layout: layout ? JSON.stringify(layout) : null,
		updatedAt: row?.updated_at ?? null,
		hasPassword: Boolean(envPassword() || row?.password_hash)
	};
}
async function writePublished(input) {
	if (Date.now() < attempts.lockedUntil) return {
		ok: false,
		error: "Too many tries. Wait a minute, then try the password again."
	};
	const password = typeof input.password === "string" ? input.password : "";
	if (password.trim().length < MIN_PASSWORD) return {
		ok: false,
		error: "Use a password of at least 4 characters."
	};
	let parsed = null;
	if (typeof input.layout === "string") try {
		parsed = JSON.parse(input.layout);
	} catch {
		parsed = null;
	}
	const layout = sanitizeLayout(parsed);
	if (!layout) return {
		ok: false,
		error: "That floor could not be saved."
	};
	const sql = await getSql();
	const current = (await sql`
    select password_hash, updated_at::text as updated_at, layout
    from yard_floor
    where id = 1
  `)[0];
	const fromEnv = envPassword();
	let nextHash = current?.password_hash ?? null;
	if (fromEnv) {
		if (!sameSecret(password, fromEnv)) return reject();
	} else if (current?.password_hash) {
		if (!await matchesHash(password, current.password_hash)) return reject();
	} else nextHash = await hashPassword(password.trim());
	const saved = await sql`
    insert into yard_floor (id, layout, password_hash, updated_at)
    values (1, ${JSON.stringify({
		version: 1,
		bays: layout
	})}::jsonb, ${nextHash}, now())
    on conflict (id) do update
      set layout = excluded.layout,
          password_hash = coalesce(yard_floor.password_hash, excluded.password_hash),
          updated_at = now()
    returning updated_at::text as updated_at
  `;
	attempts.fails = 0;
	return {
		ok: true,
		updatedAt: saved[0]?.updated_at ?? ""
	};
}
function reject() {
	attempts.fails += 1;
	if (attempts.fails >= 8) {
		attempts.lockedUntil = Date.now() + 6e4;
		attempts.fails = 0;
	}
	return {
		ok: false,
		error: "Wrong password. This browser kept the change, but the shared floor was not updated."
	};
}
//#endregion
export { readPublished, writePublished };
