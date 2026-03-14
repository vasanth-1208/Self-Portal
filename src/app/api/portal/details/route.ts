import { NextRequest, NextResponse } from "next/server";
import { BASIC_FIELDS } from "@/types/portal";
import { addDetailColumn, deleteDetailColumn, getPortalDataset } from "@/lib/portal-store";
import { canManageMembers } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createDetailSchema = z.object({
  header: z.string().min(2)
});

const deleteDetailSchema = z.object({
  header: z.string().min(2)
});

const isBaseField = (header: string) => BASIC_FIELDS.includes(header as never);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageMembers(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = createDetailSchema.parse(await request.json());
    const header = payload.header.trim();

    if (
      isBaseField(header) ||
      dataset.detailHeaders.includes(header) ||
      dataset.skillHeaders.includes(header)
    ) {
      return NextResponse.json({ error: "This column name is already reserved." }, { status: 400 });
    }

    await addDetailColumn(header);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add detail column." },
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

    const payload = deleteDetailSchema.parse(await request.json());
    const header = payload.header.trim();

    if (!dataset.detailHeaders.includes(header) || isBaseField(header)) {
      return NextResponse.json({ error: "Only custom detail columns can be deleted." }, { status: 400 });
    }

    await deleteDetailColumn(header);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete detail column." },
      { status: 400 }
    );
  }
}
