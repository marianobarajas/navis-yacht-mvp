"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Item = { id: string; name: string };

export function LogsFilters({
  yachts,
  authors,
  current,
}: {
  yachts: Item[];
  authors: Item[];
  current: { yachtId?: string; author?: string; type?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/logs?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <CustomSelect
        value={current.yachtId ?? ""}
        onChange={(v) => update("yachtId", v)}
        placeholder="All yachts"
        className="min-w-[140px]"
        options={[
          { value: "", label: "All yachts" },
          ...yachts.map((y) => ({ value: y.id, label: y.name })),
        ]}
      />
      <CustomSelect
        value={current.author ?? ""}
        onChange={(v) => update("author", v)}
        placeholder="All authors"
        className="min-w-[140px]"
        options={[
          { value: "", label: "All authors" },
          ...authors.map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      <CustomSelect
        value={current.type ?? ""}
        onChange={(v) => update("type", v)}
        placeholder="All types"
        className="min-w-[140px]"
        options={[
          { value: "", label: "All types" },
          { value: "NOTE", label: "Note" },
          { value: "STATUS_UPDATE", label: "Status update" },
          { value: "CHECKLIST", label: "Checklist" },
          { value: "PHOTO", label: "Photo" },
        ]}
      />
    </div>
  );
}
