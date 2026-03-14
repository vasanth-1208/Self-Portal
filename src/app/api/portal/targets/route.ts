import { NextRequest, NextResponse } from "next/server";
import { getPortalDataset, updateSkillTarget } from "@/lib/portal-store";
import { canManageTargets } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const payloadSchema = z.object({
  studentId: z.string().min(1),
  header: z.string().min(1),
  targeted: z.boolean()
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageTargets(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = payloadSchema.parse(await request.json());
    await updateSkillTarget(payload.studentId, payload.header, payload.targeted);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update target." },
      { status: 400 }
    );
  }
}
