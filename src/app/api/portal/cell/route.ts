import { NextRequest, NextResponse } from "next/server";
import { getPortalDataset, updateStudentCell } from "@/lib/portal-store";
import { canEditField } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const payloadSchema = z.object({
  studentId: z.string().min(1),
  studentEmail: z.string().email(),
  header: z.string().min(1),
  value: z.string()
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const payload = payloadSchema.parse(await request.json());
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canEditField(dataset, payload.studentEmail, payload.header)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextValue =
      dataset.role === "member" && dataset.skillHeaders.includes(payload.header)
        ? payload.value.trim()
          ? "Completed"
          : ""
        : payload.value;

    await updateStudentCell(payload.studentId, payload.header, nextValue);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update cell." },
      { status: 400 }
    );
  }
}
