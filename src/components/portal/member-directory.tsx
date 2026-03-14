import type { DirectoryRow } from "@/types/portal";

type Props = {
  directory: DirectoryRow[];
};

export function MemberDirectory({ directory }: Props) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sheet backdrop-blur md:p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-portal-ink">Student Directory</h2>
      </div>

      <div className="overflow-hidden rounded-3xl border border-portal-line bg-white">
        <div className="max-h-[40vh] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-portal-soft">
              <tr>
                {["Names", "Position", "Phone Number", "Special Lab Name", "Email", "Roll Number"].map(
                  (header) => (
                    <th
                      key={header}
                      className="border-b border-r border-portal-line bg-portal-soft px-4 py-3 font-medium text-portal-ink"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {directory.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                  {Object.values(row.values).map((value, index) => (
                    <td
                      key={`${row.id}-${index}`}
                      className="border-b border-r border-portal-line px-4 py-2 text-slate-700"
                    >
                      {value || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
