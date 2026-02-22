import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tool = sqliteTable("tool", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  version: text("version").notNull(),
  license: text("license"),
  company: text("company"),
  usage_restrictions: text("usage_restrictions"),
  risk_analysis: text("risk_analysis"),
  alternative_solutions: text("alternative_solutions"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});
