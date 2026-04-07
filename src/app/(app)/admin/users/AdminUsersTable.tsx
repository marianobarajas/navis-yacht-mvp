"use client";

import { useState } from "react";
import { UserDetailModal } from "./UserDetailModal";
import { DeleteUserButton } from "./DeleteUserButton";
import { roleBorderLeftClass } from "@/lib/uiAccent";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  shiftStatus?: string;
};

export function AdminUsersTable({
  users,
  actorRole,
}: {
  users: User[];
  actorRole: string;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <>
      <table className="min-w-full text-left text-base">
        <thead>
          <tr className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]">
            <th className="px-5 py-3.5 font-semibold text-[var(--apple-text-secondary)]">Name</th>
            <th className="px-5 py-3.5 font-semibold text-[var(--apple-text-secondary)]">Email</th>
            <th className="px-5 py-3.5 font-semibold text-[var(--apple-text-secondary)]">Role</th>
            <th className="px-5 py-3.5 font-semibold text-[var(--apple-text-secondary)]">Active</th>
            <th className="px-5 py-3.5 font-semibold text-[var(--apple-text-secondary)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const canDelete = u.isActive && (u.role !== "ADMIN" || actorRole === "ADMIN");
            return (
              <tr
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className="border-b border-[var(--apple-border)] cursor-pointer transition-colors hover:bg-[var(--apple-bg-subtle)]"
              >
                <td
                  className={`border-l-4 px-5 py-3.5 font-medium text-[var(--apple-text-primary)] ${roleBorderLeftClass(u.role)}`}
                >
                  {u.name}
                </td>
                <td className="px-5 py-3.5 text-[var(--apple-text-secondary)]">{u.email}</td>
                <td className="px-5 py-3.5 text-[var(--apple-text-secondary)]">{u.role}</td>
                <td className="px-5 py-3.5 text-[var(--apple-text-secondary)]">
                  {u.isActive ? "Yes" : "No"}
                </td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <DeleteUserButton
                    userId={u.id}
                    userName={u.name}
                    isActive={u.isActive}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          actorRole={actorRole}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
