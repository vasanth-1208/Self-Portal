import { NextRequest, NextResponse } from "next/server";
import { BASIC_FIELDS } from "@/types/portal";
import { addSkillColumn, deleteSkillColumn, getPortalDataset } from "@/lib/portal-store";
import { canManageSkills } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const createSkillSchema = z.object({
  header: z.string().min(2)
});

const deleteSkillSchema = z.object({
  header: z.string().min(2)
});

const isBaseField = (header: string) => BASIC_FIELDS.includes(header as never);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageSkills(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = createSkillSchema.parse(await request.json());
    const header = payload.header.trim();

    if (isBaseField(header) || dataset.headers.includes(header)) {
      return NextResponse.json({ error: "This column name is already reserved." }, { status: 400 });
    }

    await addSkillColumn(header);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add skill column." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageSkills(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = deleteSkillSchema.parse(await request.json());
    const header = payload.header.trim();

    if (!dataset.skillHeaders.includes(header) || isBaseField(header)) {
      return NextResponse.json({ error: "Only skill columns can be deleted." }, { status: 400 });
    }

    await deleteSkillColumn(header);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete skill column." },
      { status: 400 }
    );
  }
}
