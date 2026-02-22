import { NextResponse } from "next/server";
import { analyzeToolCompliance } from "@/lib/ai/zhipu";
import { db } from "@/db";
import { tool } from "@/db/schema.sql";
import { inArray } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { toolNames } = await req.json();

    if (!Array.isArray(toolNames) || toolNames.length === 0) {
      return NextResponse.json(
        { error: "toolNames array is required" },
        { status: 400 },
      );
    }

    // 1. Call AI Agent to get the compliance report
    const aiReports = await analyzeToolCompliance(toolNames);

    // 2. Query existing tools in the database to check for differences
    const existingTools = await db
      .select()
      .from(tool)
      .where(
        inArray(
          tool.name,
          aiReports.map((r: any) => r.name),
        ),
      );

    const existingToolsMap = new Map(existingTools.map((t) => [t.name, t]));

    // 3. Construct the response with comparison logic
    const scanResults = aiReports.map((report: any) => {
      const existing = existingToolsMap.get(report.name);

      if (existing) {
        // Find differences
        const differences: Record<
          string,
          { old: string | null; new: string | null }
        > = {};
        let hasDifferences = false;

        const fieldsToCompare = [
          "version",
          "license",
          "company",
          "usage_restrictions",
          "risk_analysis",
          "alternative_solutions",
        ] as const;

        for (const field of fieldsToCompare) {
          if (existing[field] !== report[field]) {
            differences[field] = { old: existing[field], new: report[field] };
            hasDifferences = true;
          }
        }

        return {
          ...report,
          isNew: false,
          id: existing.id,
          hasDifferences,
          differences: hasDifferences ? differences : null,
          existingData: existing, // Send existing data for reference
        };
      }

      return {
        ...report,
        isNew: true,
        id: null,
        hasDifferences: false,
        differences: null,
      };
    });

    return NextResponse.json({ results: scanResults });
  } catch (error) {
    console.error("Scan API Error:", error);
    return NextResponse.json(
      { error: "Failed to scan tools" },
      { status: 500 },
    );
  }
}
