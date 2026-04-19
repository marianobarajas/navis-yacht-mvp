"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CREW_POSITION_SELECT_OPTIONS, SHIFT_STATUS_SELECT_OPTIONS } from "@/lib/crew";

export function CrewFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const position = searchParams.get("position") ?? "";
  const status = searchParams.get("status") ?? "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/crew?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <CustomSelect
        value={position}
        onChange={(v) => updateFilter("position", v)}
        placeholder="All positions"
        className="min-w-[160px]"
        options={[{ value: "", label: "All positions" }, ...CREW_POSITION_SELECT_OPTIONS]}
      />
      <CustomSelect
        value={status}
        onChange={(v) => updateFilter("status", v)}
        placeholder="All statuses"
        className="min-w-[160px]"
        options={[{ value: "", label: "All statuses" }, ...SHIFT_STATUS_SELECT_OPTIONS]}
      />
    </div>
  );
}
