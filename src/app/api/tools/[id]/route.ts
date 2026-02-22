import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tool } from '@/db/schema.sql';
import { eq } from 'drizzle-orm';

// PUT update an existing tool after user confirms differences
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    // Filter out undefined values to only update provided fields
    const updateData: any = {};
    const updatableFields = ['version', 'license', 'company', 'usage_restrictions', 'risk_analysis', 'alternative_solutions'];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    updateData.updated_at = Date.now();

    const result = await db.update(tool)
      .set(updateData)
      .where(eq(tool.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tool updated successfully', tool: result[0] });
  } catch (error) {
    console.error('Update Tool Error:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

// DELETE an expired tool
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    const result = await db.delete(tool).where(eq(tool.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Delete Tool Error:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
