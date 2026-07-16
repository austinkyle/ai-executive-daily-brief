import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "@/lib/env";
import * as schema from "./schema";

mkdirSync(dirname(env.DATABASE_PATH), { recursive: true });

const sqlite = new Database(env.DATABASE_PATH);
const db = drizzle(sqlite, { schema });

export default db;
export { sqlite };
