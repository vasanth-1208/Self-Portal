"use client";

import { useState, useTransition } from "react";
import type { PortalDataset } from "@/types/portal";

type Props = {
  dataset: PortalDataset;
  refreshDataset: (path: string, init?: RequestInit) => Promise<void>;
};

const EMPTY_MEMBER = {
  Names: "",
  Position: "",
  "Phone Number": "",
  "Special Lab Name": "",
  Email: "",
  "Roll Number": "",
  "Google Sheet": "",
  "Reward Points": "0",
  "Activity Points": "0"
};

export function AdminPanel({ dataset, refreshDataset }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);
  const [isPending, startTransition] = useTransition();

  const handleGrant = () => {
    if (!email.trim()) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/admins", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          role
        })
      });
      setEmail("");
      setRole("admin");
    });
  };

  const handleRemove = (targetEmail: string) => {
    startTransition(async () => {
      await refreshDataset("/api/portal/admins", {
        method: "DELETE",
        body: JSON.stringify({
          email: targetEmail
        })
      });
    });
  };

  const handleMemberAdd = () => {
    if (!memberForm.Email.trim()) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/members", {
        method: "POST",
        body: JSON.stringify({
          values: memberForm
        })
      });
      setMemberForm(EMPTY_MEMBER);
    });
  };

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sheet backdrop-blur md:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-portal-ink">Super Admin Controls</h2>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-portal-line bg-white p-4">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Add Member</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(memberForm).map(([key, value]) => (
              <input
                key={key}
                value={value}
                onChange={(event) =>
                  setMemberForm((current) => ({
                    ...current,
                    [key]: event.target.value
                  }))
                }
                placeholder={key}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-portal-ink"
              />
            ))}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleMemberAdd}
            className="mt-4 rounded-2xl bg-portal-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add member
          </button>
        </div>

        <div className="rounded-3xl border border-portal-line bg-white p-4">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Role Management</h3>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="member@example.edu"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-portal-ink"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "admin" | "super_admin")}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-portal-ink"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button
              type="button"
              disabled={isPending}
              onClick={handleGrant}
              className="w-full rounded-2xl bg-portal-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Grant access
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-portal-line bg-white">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-portal-soft">
            <tr>
              <th className="border-b border-r border-portal-line px-4 py-3 font-medium">Email</th>
              <th className="border-b border-r border-portal-line px-4 py-3 font-medium">Role</th>
              <th className="border-b border-portal-line px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {dataset.adminEmails.map((adminEmail) => {
              const panelRole =
                adminEmail === dataset.superAdminEmail ? "super_admin" : "admin";
              const isProtected = adminEmail === dataset.superAdminEmail;

              return (
                <tr key={adminEmail} className="odd:bg-white even:bg-slate-50/60">
                  <td className="border-b border-r border-portal-line px-4 py-2">{adminEmail}</td>
                  <td className="border-b border-r border-portal-line px-4 py-2 uppercase tracking-[0.14em] text-slate-500">
                    {panelRole.replace("_", " ")}
                  </td>
                  <td className="border-b border-portal-line px-4 py-2">
                    <button
                      type="button"
                      disabled={isProtected || isPending}
                      onClick={() => handleRemove(adminEmail)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-portal-alert transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
