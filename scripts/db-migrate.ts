/**
 * Creates the local SQLite database file and applies db/schema.sql.
 * Idempotent: the schema is all IF NOT EXISTS, so re-running after an
 * update applies only what's new and never touches existing rows.
 *
 *   bun run db:migrate
 */
import fs from "node:fs"
import path from "node:path"

import { DB_PATH, getDb } from "../lib/db"

const SCHEMA_VERSION = 1

const schemaPath = path.join(process.cwd(), "db", "schema.sql")
const schema = fs.readFileSync(schemaPath, "utf8")

const db = getDb()
const before = Number(db.pragma("user_version", { simple: true }))

db.exec(schema)
db.pragma(`user_version = ${SCHEMA_VERSION}`)

const tables = db
  .prepare<[], { name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )
  .all()
  .map((row) => row.name)

console.log(`Database: ${DB_PATH}`)
console.log(`Schema version: ${before} -> ${SCHEMA_VERSION}`)
console.log(`Tables: ${tables.join(", ")}`)
