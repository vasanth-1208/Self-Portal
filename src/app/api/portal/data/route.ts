import { NextRequest, NextResponse } from "next/server";
import { getPortalDatasetWithOptions } from "@/lib/portal-store";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const includeTeamData = request.nextUrl.searchParams.get("view") === "team";
    const dataset = await getPortalDatasetWithOptions(session.user!.email!, {
      includeTeamData
    });

    return NextResponse.json(dataset);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load data." },
      { status: 401 }
    );
  }
}
