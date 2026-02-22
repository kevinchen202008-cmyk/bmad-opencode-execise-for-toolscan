import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
});

export const db = drizzle(client);
