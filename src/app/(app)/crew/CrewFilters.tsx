"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ROLE_SELECT_OPTIONS, SHIFT_STATUS_SELECT_OPTIONS } from "@/lib/crew";

export function CrewFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "";
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
        value={role}
        onChange={(v) => updateFilter("role", v)}
        placeholder="All roles"
        className="min-w-[160px]"
        options={[{ value: "", label: "All roles" }, ...ROLE_SELECT_OPTIONS]}
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
