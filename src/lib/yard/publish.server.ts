import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getSql } from "@/lib/db";
import { sanitizeLayout } from "@/lib/yard/data";

const scryptAsync = promisify(scrypt);
const MIN_PASSWORD = 4;

type FloorRow = {
  layout: unknown;
  password_hash: string | null;
  updated_at: string | null;
};

export type PublishedFloor = {
  layout: string | null;
  updatedAt: string | null;
  hasPassword: boolean;
};

export type PublishResult =
  | { ok: true; updatedAt: string }
  | { ok: false; error: string };

const attempts = { fails: 0, lockedUntil: 0 };

function envPassword(): string | undefined {
  const value = process.env.YARD_SAVE_PASSWORD?.trim();
  return value || undefined;
}

function sameSecret(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function matchesHash(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function asLayout(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value;
}

export async function readPublished(): Promise<PublishedFloor> {
  const sql = await getSql();
  const rows = await sql<FloorRow>`
    select layout, password_hash, updated_at::text as updated_at
    from yard_floor
    where id = 1
  `;
  const row = rows[0];
  const layout = row ? asLayout(row.layout) : null;
  return {
    layout: layout ? JSON.stringify(layout) : null,
    updatedAt: row?.updated_at ?? null,
    hasPassword: Boolean(envPassword() || row?.password_hash),
  };
}

export async function writePublished(input: { password?: string; layout?: string }): Promise<PublishResult> {
  if (Date.now() < attempts.lockedUntil) {
    return { ok: false, error: "Too many tries. Wait a minute, then try the password again." };
  }
  const password = typeof input.password === "string" ? input.password : "";
  if (password.trim().length < MIN_PASSWORD) {
    return { ok: false, error: "Use a password of at least 4 characters." };
  }
  let parsed: unknown = null;
  if (typeof input.layout === "string") {
    try {
      parsed = JSON.parse(input.layout) as unknown;
    } catch {
      parsed = null;
    }
  }
  const layout = sanitizeLayout(parsed);
  if (!layout) return { ok: false, error: "That floor could not be saved." };

  const sql = await getSql();
  const rows = await sql<FloorRow>`
    select password_hash, updated_at::text as updated_at, layout
    from yard_floor
    where id = 1
  `;
  const current = rows[0];
  const fromEnv = envPassword();
  let nextHash = current?.password_hash ?? null;
  if (fromEnv) {
    if (!sameSecret(password, fromEnv)) {
      return reject();
    }
  } else if (current?.password_hash) {
    if (!(await matchesHash(password, current.password_hash))) {
      return reject();
    }
  } else {
    nextHash = await hashPassword(password.trim());
  }

  const saved = await sql<{ updated_at: string }>`
    insert into yard_floor (id, layout, password_hash, updated_at)
    values (1, ${JSON.stringify({ version: 1, bays: layout })}::jsonb, ${nextHash}, now())
    on conflict (id) do update
      set layout = excluded.layout,
          password_hash = coalesce(yard_floor.password_hash, excluded.password_hash),
          updated_at = now()
    returning updated_at::text as updated_at
  `;
  attempts.fails = 0;
  return { ok: true, updatedAt: saved[0]?.updated_at ?? "" };
}

function reject(): PublishResult {
  attempts.fails += 1;
  if (attempts.fails >= 8) {
    attempts.lockedUntil = Date.now() + 60_000;
    attempts.fails = 0;
  }
  return { ok: false, error: "Wrong password. This browser kept the change, but the shared floor was not updated." };
}
