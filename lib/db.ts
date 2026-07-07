/**
 * Server-only SQLite client. Never import this from a "use client" module —
 * better-sqlite3 is a native Node module and only runs on the server (API
 * routes, server components, scripts).
 *
 * The database lives in a single file, ./data/bookie.db by default; override
 * with the BOOKIE_DB_PATH env var. Back up your data by copying that file.
 */
import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

export const DB_PATH =
  process.env.BOOKIE_DB_PATH ?? path.join(process.cwd(), "data", "bookie.db")

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new Database(DB_PATH)
  // WAL lets reads proceed during writes; NORMAL sync is safe under WAL.
  db.pragma("journal_mode = WAL")
  db.pragma("synchronous = NORMAL")
  db.pragma("foreign_keys = ON")
  return db
}
