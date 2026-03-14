import { NextRequest, NextResponse } from "next/server";
import { createMember, deleteMember, getPortalDataset } from "@/lib/portal-store";
import { canManageMembers } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  values: z.record(z.string(), z.string())
});

const deleteSchema = z.object({
  studentId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageMembers(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = createSchema.parse(await request.json());
    await createMember(payload.values);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create member." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageMembers(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = deleteSchema.parse(await request.json());
    await deleteMember(payload.studentId);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete member." },
      { status: 400 }
    );
  }
}
