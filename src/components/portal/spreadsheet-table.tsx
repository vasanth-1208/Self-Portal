"use client";

import { useEffect, useState, useTransition } from "react";
import type { PortalDataset, StudentRow } from "@/types/portal";

type Props = {
  dataset: PortalDataset;
  refreshDataset: (path: string, init?: RequestInit) => Promise<void>;
};

const DETAIL_FIELDS = [
  "Names",
  "Position",
  "Phone Number",
  "Special Lab Name",
  "Email",
  "Roll Number",
  "Reward Points",
  "Activity Points"
] as const;

const isSkillCompleted = (value: string) => value.trim().toLowerCase() === "completed";
const getCompletedSkillCount = (row: StudentRow, skillHeaders: string[]) =>
  skillHeaders.reduce(
    (count, header) => count + (isSkillCompleted(row.values[header] || "") ? 1 : 0),
    0
  );

const TOTAL_SKILLS_COMPLETED = "Total Skills Completed";
const CURRENT_TARGETS = "Current Targets";
const TARGETS_COMPLETED = "Targets completed";
const TARGETS_PROGRESS = "Count of Targets Completed";

const normalizeLocalEmail = (value: string) => `${value || ""}`.trim().toLowerCase();

const getPositionSortKey = (positionRaw: string) => {
  const position = `${positionRaw || ""}`.toLowerCase();

  if (position.includes("team leader") || (position.includes("captain") && !position.includes("vice"))) {
    return { rank: 0, memberNumber: 0, label: position };
  }

  if (position.includes("vice")) {
    return { rank: 1, memberNumber: 0, label: position };
  }

  if (position.includes("manager")) {
    return { rank: 2, memberNumber: 0, label: position };
  }

  if (position.includes("strategist")) {
    return { rank: 3, memberNumber: 0, label: position };
  }

  if (position.includes("team member")) {
    const match = position.match(/team member\s*-\s*(\d+)/);
    const memberNumber = match ? Number(match[1]) : 9999;
    return { rank: 4, memberNumber, label: position };
  }

  return { rank: 999, memberNumber: 0, label: position };
};

const SUMMARY_DETAIL_FIELDS = [
  "Names",
  "Position",
  "Phone Number",
  "Special Lab Name",
  "Email",
  "Roll Number",
  "Reward Points",
  "Activity Points",
  TOTAL_SKILLS_COMPLETED,
  CURRENT_TARGETS,
  TARGETS_COMPLETED,
  TARGETS_PROGRESS,
  "Github",
  "Linkedin",
  "Primary Skill 1",
  "Primary Skill 2",
  "Project domain",
  "Secondary Skill 1",
  "Secondary Skill 2",
  "Specialized skill 1",
  "Specialized skill 2",
  "X (Twitter)"
] as const;

export function SpreadsheetTable({ dataset, refreshDataset }: Props) {
  const [isPending, startTransition] = useTransition();
  const [newSkill, setNewSkill] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const isPersonalView = dataset.role === "member" || !dataset.teamViewLoaded;
  const rows = isPersonalView ? (dataset.ownRow ? [dataset.ownRow] : []) : dataset.students;
  const canManageSkills =
    dataset.teamViewLoaded && (dataset.role === "admin" || dataset.role === "super_admin");
  const canManageDetails = dataset.teamViewLoaded && dataset.role === "super_admin";
  const title = isPersonalView ? "My Skill Progress Tracker" : "Student Skill Progress Tracker";

  useEffect(() => {
    // Team view behaves like an accordion: start collapsed when switching into it.
    if (!isPersonalView) {
      setExpandedRowId(null);
    }
  }, [isPersonalView]);

  const sortedRows = rows.slice().sort((left, right) => {
    const leftKey = getPositionSortKey(left.values.Position || "");
    const rightKey = getPositionSortKey(right.values.Position || "");

    if (leftKey.rank !== rightKey.rank) {
      return leftKey.rank - rightKey.rank;
    }

    if (leftKey.memberNumber !== rightKey.memberNumber) {
      return leftKey.memberNumber - rightKey.memberNumber;
    }

    const labelCompare = leftKey.label.localeCompare(rightKey.label);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    return `${left.values.Names || ""}`.localeCompare(`${right.values.Names || ""}`);
  });

  const summaryColumns = (() => {
    const base = SUMMARY_DETAIL_FIELDS.slice() as string[];
    const extras = dataset.detailHeaders.filter((header) => !base.includes(header));
    return [...base, ...extras];
  })();

  const handleCellSave = (row: StudentRow, header: string, value: string) => {
    startTransition(async () => {
      await refreshDataset("/api/portal/cell", {
        method: "PATCH",
        body: JSON.stringify({
          studentId: row.id,
          studentEmail: row.values.Email,
          header,
          value
        })
      });
    });
  };

  const handleTargetToggle = (row: StudentRow, header: string, targeted: boolean) => {
    startTransition(async () => {
      await refreshDataset("/api/portal/targets", {
        method: "PATCH",
        body: JSON.stringify({
          studentId: row.id,
          header,
          targeted
        })
      });
    });
  };

  const handleDeleteMember = (row: StudentRow) => {
    if (!window.confirm(`Delete ${row.values.Names || row.values.Email}?`)) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/members", {
        method: "DELETE",
        body: JSON.stringify({
          studentId: row.id
        })
      });
    });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/skills", {
        method: "POST",
        body: JSON.stringify({ header: newSkill.trim() })
      });
      setNewSkill("");
    });
  };

  const handleAddDetail = () => {
    if (!newDetail.trim()) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/details", {
        method: "POST",
        body: JSON.stringify({ header: newDetail.trim() })
      });
      setNewDetail("");
    });
  };

  const handleDeleteSkill = (header: string) => {
    if (!window.confirm(`Delete skill column "${header}" for everyone?`)) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/skills", {
        method: "DELETE",
        body: JSON.stringify({ header })
      });
    });
  };

  const handleDeleteDetail = (header: string) => {
    if (!window.confirm(`Delete detail column "${header}" for everyone?`)) {
      return;
    }

    startTransition(async () => {
      await refreshDataset("/api/portal/details", {
        method: "DELETE",
        body: JSON.stringify({ header })
      });
    });
  };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-sheet backdrop-blur">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#13343B_55%,#1f6b62_100%)] px-5 py-5 text-white md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>

          {(canManageSkills || canManageDetails) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {canManageDetails && (
                <>
                  <input
                    value={newDetail}
                    onChange={(event) => setNewDetail(event.target.value)}
                    placeholder="Add detail column"
                    className="min-w-64 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-300 outline-none transition focus:border-amber-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    disabled={isPending}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Detail column add
                  </button>
                </>
              )}
              {canManageSkills && (
                <>
                  <input
                    value={newSkill}
                    onChange={(event) => setNewSkill(event.target.value)}
                    placeholder="Add new skill column"
                    className="min-w-64 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-300 outline-none transition focus:border-amber-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={isPending}
                    className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add skill
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="space-y-5">
          {sortedRows.map((row, rowIndex) => {
            const isOwnRow = normalizeLocalEmail(dataset.userEmail) === normalizeLocalEmail(row.values.Email || "");
            const visibleSkills = dataset.skillHeaders;
            const completedSkillCount = getCompletedSkillCount(row, dataset.skillHeaders);
            const totalTargets = row.targetSkills.length;
            const completedTargets = row.targetSkills.filter((header) =>
              isSkillCompleted(row.values[header] || "")
            ).length;
            const currentTargets = row.targetSkills.join(", ");
            const targetsCompleted = row.targetSkills
              .filter((header) => isSkillCompleted(row.values[header] || ""))
              .join(", ");
            const targetsProgress = `${completedTargets}/${totalTargets}`;
            const isAccordion = !isPersonalView;
            const isExpanded = !isAccordion || expandedRowId === row.id;

            return (
              <article
                key={row.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50"
              >
                <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 font-mono text-sm text-white">
                        {rowIndex + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {row.values.Names || "Unnamed Student"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {row.values.Position || "-"} · {row.values.Email || "No email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isPersonalView ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRowId((current) => (current === row.id ? null : row.id))
                          }
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                          aria-expanded={isExpanded}
                          aria-controls={`skills-${row.id}`}
                        >
                          <span
                            className={`text-base leading-none transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            aria-hidden="true"
                          >
                            ▼
                          </span>
                          {isExpanded ? "Hide details" : "Show details"}
                        </button>
                      ) : null}
                      {dataset.role === "super_admin" && dataset.teamViewLoaded && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(row)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete member
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                          Total Skills Completed
                        </p>
                        <span className="block text-sm font-semibold text-emerald-800">
                          {completedSkillCount}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {TARGETS_PROGRESS}
                        </p>
                        <span className="block text-sm font-semibold text-slate-800">
                          {targetsProgress}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {CURRENT_TARGETS}
                        </p>
                        <span className="block text-sm text-slate-700">{currentTargets || "-"}</span>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {TARGETS_COMPLETED}
                        </p>
                        <span className="block text-sm text-slate-700">
                          {targetsCompleted || "-"}
                        </span>
                      </div>
                      {[...DETAIL_FIELDS, ...dataset.detailHeaders].map((field) => {
                        const value = row.values[field] || "";
                        const isCustomDetail = dataset.detailHeaders.includes(field);
                        const canEditOwnActivity = isOwnRow && field === "Activity Points";
                        const fieldEditable =
                          (dataset.teamViewLoaded &&
                            (dataset.role === "super_admin" || dataset.role === "admin") &&
                            field !== "Reward Points") ||
                          canEditOwnActivity ||
                          (isOwnRow && dataset.detailHeaders.includes(field));

                        return (
                          <div
                            key={`${row.id}-${field}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {field}
                              </p>
                              {dataset.teamViewLoaded &&
                              dataset.role === "super_admin" &&
                              isCustomDetail ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDetail(field)}
                                  className="shrink-0 rounded-full border border-rose-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                            {fieldEditable ? (
                              <EditableCell
                                value={value}
                                disabled={isPending}
                                onSave={(nextValue) => handleCellSave(row, field, nextValue)}
                              />
                            ) : (
                              <span className="block text-sm text-slate-700">{value || "-"}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {isExpanded ? (
                  <div id={`skills-${row.id}`} className="px-4 py-4 md:px-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Skills
                      </h4>
                      <span className="text-xs text-slate-400">{visibleSkills.length} total</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                      {visibleSkills.map((header) => {
                        const value = row.values[header] || "";
                        const checked = isSkillCompleted(value);
                        const targeted = row.targetSkills.includes(header);

                        return (
                          <div
                            key={`${row.id}-${header}`}
                            className={`rounded-2xl border bg-white p-3 shadow-sm ${
                              targeted
                                ? "border-amber-300 ring-1 ring-amber-200"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="mb-3 flex min-h-14 items-start justify-between gap-2">
                              <div className="space-y-2">
                                <p className="text-sm font-medium leading-5 text-slate-800">
                                  {header}
                                </p>
                                {targeted ? (
                                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                    Target
                                  </span>
                                ) : null}
                              </div>
                              {canManageSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSkill(header)}
                                  className="shrink-0 rounded-full border border-rose-200 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              )}
                            </div>

                            {canManageSkills && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleTargetToggle(row, header, !targeted)}
                                className={`mb-3 inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                                  targeted
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                {targeted ? "Remove target" : "Mark target"}
                              </button>
                            )}

                            <SkillToggleCell
                              checked={checked}
                              disabled={isPending}
                              onChange={(nextChecked) =>
                                handleCellSave(row, header, nextChecked ? "Completed" : "")
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!isPersonalView ? (
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-5">
              <h3 className="text-base font-semibold text-slate-900">Team Details</h3>
              <p className="mt-1 text-sm text-slate-500">
                Includes total skills completed and all detail columns.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-max border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    {summaryColumns.map((header) => (
                      <th
                        key={header}
                        className={`min-w-max whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 align-top font-medium text-slate-700 ${
                          header === "Names"
                            ? "sticky left-0 z-20 bg-white shadow-[2px_0_0_0_rgba(226,232,240,1)]"
                            : ""
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, index) => {
                    const totalCompleted = getCompletedSkillCount(row, dataset.skillHeaders);
                    const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50";
                    const isOwnRow =
                      normalizeLocalEmail(dataset.userEmail) ===
                      normalizeLocalEmail(row.values.Email || "");
                    const totalTargets = row.targetSkills.length;
                    const completedTargets = row.targetSkills.filter((header) =>
                      isSkillCompleted(row.values[header] || "")
                    ).length;
                    const currentTargets = row.targetSkills.join(", ");
                    const targetsCompleted = row.targetSkills
                      .filter((header) => isSkillCompleted(row.values[header] || ""))
                      .join(", ");
                    const targetsProgress = `${completedTargets}/${totalTargets}`;
                    return (
                      <tr key={`summary-${row.id}`} className={rowBg}>
                        {summaryColumns.map((header) => (
                          <td
                            key={`${row.id}-${header}`}
                            className={`min-w-max whitespace-nowrap border-b border-r border-slate-200 px-4 py-2 align-top text-slate-700 ${
                              header === "Names"
                                ? `sticky left-0 z-10 ${rowBg} shadow-[2px_0_0_0_rgba(226,232,240,1)]`
                                : ""
                            }`}
                          >
                            {header === TOTAL_SKILLS_COMPLETED ? (
                              <span className="font-medium text-slate-800">{totalCompleted}</span>
                            ) : header === CURRENT_TARGETS ? (
                              <span className="block min-w-max">{currentTargets || "-"}</span>
                            ) : header === TARGETS_COMPLETED ? (
                              <span className="block min-w-max">{targetsCompleted || "-"}</span>
                            ) : header === TARGETS_PROGRESS ? (
                              <span className="block min-w-max font-medium text-slate-800">
                                {targetsProgress}
                              </span>
                            ) : (() => {
                                const value = row.values[header] || "";
                                const fieldEditable =
                                  (dataset.teamViewLoaded &&
                                    (dataset.role === "super_admin" || dataset.role === "admin") &&
                                    header !== "Reward Points") ||
                                  (isOwnRow &&
                                    (header === "Activity Points" ||
                                      dataset.detailHeaders.includes(header)));

                                return fieldEditable ? (
                                  <EditableCell
                                    value={value}
                                    disabled={isPending}
                                    autoWidth
                                    onSave={(nextValue) => handleCellSave(row, header, nextValue)}
                                  />
                                ) : (
                                  <span className="block min-w-max">{value || "-"}</span>
                                );
                              })()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function EditableCell({
  value,
  onSave,
  disabled,
  className,
  autoWidth
}: {
  value: string;
  onSave: (value: string) => void;
  disabled: boolean;
  className?: string;
  autoWidth?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const widthCh = Math.min(Math.max((draft || value || "-").length + 1, 8), 64);

  return (
    <input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== value) {
          onSave(draft);
        }
      }}
      disabled={disabled}
      size={autoWidth ? widthCh : undefined}
      style={autoWidth ? { width: `${widthCh}ch` } : undefined}
      className={`rounded-xl border border-transparent bg-transparent px-1 py-1 text-sm text-slate-700 outline-none transition focus:border-amber-200 focus:bg-amber-50 disabled:cursor-not-allowed ${
        autoWidth ? "min-w-max" : "w-full"
      } ${className || ""}`.trim()}
    />
  );
}

function SkillToggleCell({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
        checked
          ? "border-emerald-900 bg-emerald-800 text-white hover:bg-emerald-900"
          : "border-rose-900 bg-rose-800 text-white hover:bg-rose-900"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {checked ? "Completed" : "Not Completed"}
    </button>
  );
}
