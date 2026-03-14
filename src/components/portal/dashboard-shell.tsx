"use client";

import { useMemo, useState, useTransition } from "react";
import type { PortalDataset } from "@/types/portal";
import { signOutUser } from "@/app/actions/auth-actions";
import { SpreadsheetTable } from "@/components/portal/spreadsheet-table";
import { MemberDirectory } from "@/components/portal/member-directory";
import { AdminPanel } from "@/components/portal/admin-panel";

type Props = {
  initialDataset: PortalDataset;
  userName: string;
};

export function DashboardShell({ initialDataset, userName }: Props) {
  const [dataset, setDataset] = useState(initialDataset);
  const [status, setStatus] = useState("");
  const [showDirectory, setShowDirectory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canOpenTeamView = dataset.role === "admin" || dataset.role === "super_admin";

  const roleLabel = useMemo(() => {
    if (dataset.role === "super_admin") {
      return "Super Admin";
    }

    if (dataset.role === "admin") {
      return "Admin";
    }

    return "Member";
  }, [dataset.role]);

  const refreshDataset = async (path: string, init?: RequestInit) => {
    setStatus("");
    const requestedView = (() => {
      if (path.startsWith("/api/portal/data?view=team")) {
        return "team";
      }

      if (path.startsWith("/api/portal/data?view=self")) {
        return "self";
      }

      return dataset.role === "member" ? "self" : dataset.teamViewLoaded ? "team" : "self";
    })();
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    });

    const next = await response.json();

    if (!response.ok) {
      throw new Error(next.error || "Request failed.");
    }

    const followUpResponse = await fetch(`/api/portal/data?view=${requestedView}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const refreshedDataset = await followUpResponse.json();

    if (!followUpResponse.ok) {
      throw new Error(refreshedDataset.error || "Failed to refresh current view.");
    }

    startTransition(() => {
      setDataset(refreshedDataset);
      setStatus("Saved to MongoDB.");
    });
  };

  const handleTeamView = async () => {
    await refreshDataset("/api/portal/data?view=team", {
      method: "GET"
    });
  };

  const handleSelfView = async () => {
    await refreshDataset("/api/portal/data?view=self", {
      method: "GET"
    });
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <section className="rounded-[28px] border border-white/70 bg-white/90 px-6 py-5 shadow-sheet backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-portal-ink">
                A#100005 Portal
              </h1>
              <p className="text-sm text-slate-600">
                Signed in as <span className="font-medium text-portal-ink">{userName || dataset.userEmail}</span>
                {" · "}
                <span>{dataset.userEmail}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                {roleLabel}
              </span>
              {canOpenTeamView && (
                <button
                  type="button"
                  onClick={dataset.teamViewLoaded ? handleSelfView : handleTeamView}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {dataset.teamViewLoaded ? "Self View" : "Team View"}
                </button>
              )}
              {dataset.role === "member" && (
                <button
                  type="button"
                  onClick={() => setShowDirectory((current) => !current)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {showDirectory ? "Hide details" : "All details"}
                </button>
              )}
              <form action={signOutUser}>
                <button
                  type="submit"
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            {status ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-portal-success">{status}</span> : null}
            {isPending ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Syncing...</span> : null}
          </div>
        </section>

        {canOpenTeamView && dataset.teamViewLoaded && (
          <SpreadsheetTable dataset={dataset} refreshDataset={refreshDataset} />
        )}

        {canOpenTeamView && !dataset.teamViewLoaded && (
          <div className="space-y-5">
            <SpreadsheetTable dataset={dataset} refreshDataset={refreshDataset} />
          </div>
        )}

        {dataset.role === "member" && (
          <div className="space-y-5">
            <SpreadsheetTable dataset={dataset} refreshDataset={refreshDataset} />
            {showDirectory ? <MemberDirectory directory={dataset.directory} /> : null}
          </div>
        )}

        {dataset.role === "super_admin" && dataset.teamViewLoaded && (
          <AdminPanel dataset={dataset} refreshDataset={refreshDataset} />
        )}
      </div>
    </main>
  );
}
