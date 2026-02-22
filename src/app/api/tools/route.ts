import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tool } from '@/db/schema.sql';
import { desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET all tools, ordered alphabetically
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const order = searchParams.get('order') === 'desc' ? desc(tool.name) : asc(tool.name);

    const tools = await db.select().from(tool).orderBy(order);
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Fetch Tools Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// POST a new tool after user confirmation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, version, license, company, usage_restrictions, risk_analysis, alternative_solutions } = body;

    if (!name || !version) {
      return NextResponse.json({ error: 'Name and version are required' }, { status: 400 });
    }

    const newTool = {
      id: nanoid(),
      name,
      version,
      license: license || null,
      company: company || null,
      usage_restrictions: usage_restrictions || null,
      risk_analysis: risk_analysis || null,
      alternative_solutions: alternative_solutions || null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await db.insert(tool).values(newTool).returning();

    return NextResponse.json({ message: 'Tool added successfully', tool: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Add Tool Error:', error);
    return NextResponse.json({ error: 'Failed to add tool' }, { status: 500 });
  }
}
