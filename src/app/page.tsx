import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/portal/dashboard-shell";
import { getPortalDatasetWithOptions } from "@/lib/portal-store";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dataset = await getPortalDatasetWithOptions(session.user.email, {
    includeTeamData: false
  });

  return <DashboardShell initialDataset={dataset} userName={session.user.name || ""} />;
}
