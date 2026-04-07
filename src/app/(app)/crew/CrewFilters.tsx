"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
        className="min-w-[140px]"
        options={[
          { value: "", label: "All roles" },
          { value: "ADMIN", label: "Admin" },
          { value: "MANAGER", label: "Member" },
          { value: "TECHNICIAN", label: "Technician" },
        ]}
      />
      <CustomSelect
        value={status}
        onChange={(v) => updateFilter("status", v)}
        placeholder="All status"
        className="min-w-[140px]"
        options={[
          { value: "", label: "All status" },
          { value: "ON_SHIFT", label: "On Shift" },
          { value: "OFF_DUTY", label: "Off Duty" },
          { value: "UNAVAILABLE", label: "Unavailable" },
        ]}
      />
    </div>
  );
}
