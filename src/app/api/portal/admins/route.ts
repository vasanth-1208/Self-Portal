import { NextRequest, NextResponse } from "next/server";
import { getPortalDataset, removeRole, upsertRole } from "@/lib/portal-store";
import { canManageRoles } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const upsertSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "super_admin"])
});

const removeSchema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageRoles(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = upsertSchema.parse(await request.json());
    await upsertRole(payload.email, payload.role);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to grant admin access." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    const dataset = await getPortalDataset(session.user!.email!);

    if (!canManageRoles(dataset)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = removeSchema.parse(await request.json());
    await removeRole(payload.email);
    const refreshed = await getPortalDataset(session.user!.email!);

    return NextResponse.json(refreshed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove admin access." },
      { status: 400 }
    );
  }
}
