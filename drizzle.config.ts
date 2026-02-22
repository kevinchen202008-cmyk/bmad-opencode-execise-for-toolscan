import type { Config } from "drizzle-kit";

export default {
  schema: "./src/**/*.sql.ts",
  out: "./migration",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:local.db",
  },
} satisfies Config;
