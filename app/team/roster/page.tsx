


"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import TeamSidebar from "@/components/team-sidebar";

type MemberRole =
  | "PLAYER"
  | "OWNER"
  | "MANAGER"
  | "COACH"
  | "ANALYST";

type CompetitiveRole =
  | "IGL"
  | "ASSAULTER"
  | "ENTRY_FRAGGER"
  | "SUPPORT"
  | "SNIPER"
  | "SCOUT"
  | "FLEX"
  | "CUSTOM";

type User = {
  id: string;
  username: string;
  displayName: string;
};

type Member = {
  id: string;
  teamId: string;
  userId: string | null;
  name: string;
  ign: string | null;
  characterId: string | null;
  role: MemberRole;
  competitiveRole: CompetitiveRole | string | null;
  photoUrl: string | null;
  isMainPlayer: boolean;
  rosterOrder: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User | null;
};

type RosterResponse = {
  success: boolean;
  roster: Member[];
  players: Member[];
  slots: (Member | null)[];
  coach: Member | null;
  analyst: Member | null;
  playerCount: number;
  requiredPlayerCount: number;
  maximumPlayerCount: number;
  rosterComplete: boolean;
};

type FormRole =
  | "PLAYER"
  | "COACH"
  | "ANALYST";

type FormState = {
  role: FormRole;
  name: string;
  username: string;
  ign: string;
  characterId: string;
  competitiveRole: string;
  password: string;
  rosterOrder: string;
};

const emptyForm: FormState = {
  role: "PLAYER",
  name: "",
  username: "",
  ign: "",
  characterId: "",
  competitiveRole: "",
  password: "",
  rosterOrder: "",
};

const competitiveRoleOptions = [
  {
    value: "IGL",
    label: "IGL",
  },
  {
    value: "ASSAULTER",
    label: "Assaulter",
  },
  {
    value: "ENTRY_FRAGGER",
    label: "Entry Fragger",
  },
  {
    value: "SUPPORT",
    label: "Support",
  },
  {
    value: "SNIPER",
    label: "Sniper",
  },
  {
    value: "SCOUT",
    label: "Scout",
  },
  {
    value: "FLEX",
    label: "Flex",
  },
  {
    value: "CUSTOM",
    label: "Custom",
  },
] as const;

export default function RosterPage() {
  const [data, setData] =
    useState<RosterResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [form, setForm] =
    useState<FormState>({
      ...emptyForm,
    });

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState<Member | null>(null);

  const [editPassword, setEditPassword] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [currentRoles, setCurrentRoles] =
    useState<string[]>([]);

  const canManage =
    currentRoles.includes("OWNER") ||
    currentRoles.includes("MANAGER");

  const isOwner =
    currentRoles.includes("OWNER");

  async function loadRoster() {
    setError("");

    try {
      const response =
        await fetch(
          "/api/team/roster",
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load roster."
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load roster."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoster();

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        setCurrentRoles(
          Array.isArray(result.roles)
            ? result.roles.map((role: string) =>
                role.toUpperCase()
              )
            : []
        );
      } catch {
        // Keep roster usable.
      }
    }

    loadCurrentUser();
  }, []);

  function openAddPlayer(
    slot: number
  ) {
    setEditing(null);

    setForm({
      ...emptyForm,
      role: "PLAYER",
      rosterOrder: String(slot),
    });

    setEditPassword("");
    setFormOpen(true);
  }

  function openAddStaff(
    role: "COACH" | "ANALYST"
  ) {
    setEditing(null);

    setForm({
      ...emptyForm,
      role,
    });

    setEditPassword("");
    setFormOpen(true);
  }

  function openEdit(
    member: Member
  ) {
    /*
     * Owner and Manager accounts are
     * administrator accounts, not roster
     * members. They are managed separately.
     */
    if (
      member.role === "OWNER" ||
      member.role === "MANAGER"
    ) {
      return;
    }

    const role: FormRole =
      member.role === "PLAYER"
        ? "PLAYER"
        : member.role === "COACH"
        ? "COACH"
        : "ANALYST";

    setEditing(member);

    setForm({
      role,

      name:
        member.name,

      username:
        member.user?.username || "",

      ign:
        member.ign || "",

      characterId:
        member.characterId || "",

      competitiveRole:
        member.competitiveRole || "",

      password: "",

      rosterOrder:
        member.rosterOrder
          ? String(
              member.rosterOrder
            )
          : "",
    });

    setEditPassword("");

    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditing(null);

    setForm({
      ...emptyForm,
    });

    setEditPassword("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      if (editing) {
        const body: Record<
          string,
          unknown
        > = {
          name:
            form.name.trim(),

          photoUrl:
            null,
        };

        if (
          editing.role ===
          "PLAYER"
        ) {
          body.ign =
            form.ign.trim();

          body.characterId =
            form.characterId.trim();

          body.competitiveRole =
            form.competitiveRole ||
            null;

          body.rosterOrder =
            form.rosterOrder
              ? Number(
                  form.rosterOrder
                )
              : null;

          if (
            editPassword.trim()
          ) {
            body.password =
              editPassword;
          }
        } else {
          body.username =
            form.username.trim();

          if (
            editPassword.trim()
          ) {
            body.password =
              editPassword;
          }
        }

        const response =
          await fetch(
            `/api/team/roster?id=${editing.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                body
              ),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to update member."
          );
        }
      } else {
        const body: Record<
          string,
          unknown
        > = {
          role: form.role,

          name:
            form.name.trim(),
        };

        if (
          form.role ===
          "PLAYER"
        ) {
          body.ign =
            form.ign.trim();

          body.characterId =
            form.characterId.trim();

          body.competitiveRole =
            form.competitiveRole ||
            null;

          body.password =
            form.password;

          body.rosterOrder =
            Number(
              form.rosterOrder
            );
        } else {
          body.username =
            form.username.trim();

          body.password =
            form.password;
        }

        const response =
          await fetch(
            "/api/team/roster",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                body
              ),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to add member."
          );
        }
      }

      closeForm();

      await loadRoster();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save member."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    member: Member
  ) {
    if (
      member.role === "OWNER"
    ) {
      return;
    }

    if (
      member.role === "MANAGER" &&
      !isOwner
    ) {
      return;
    }

    if (!canManage) {
      return;
    }

    if (
      !window.confirm(
        member.role === "MANAGER"
          ? `Remove ${member.name} as Manager?`
          : `Remove ${member.name} from the team?`
      )
    ) {
      return;
    }

    setDeletingId(member.id);
    setError("");

    try {
      const response =
        await fetch(
          `/api/team/roster?id=${member.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to remove member."
        );
      }

      await loadRoster();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove member."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080a0c] text-white">
        <TeamSidebar />

        <div className="ml-[260px] min-h-screen px-6 py-10 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-white/50">
              Loading roster...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#080a0c] text-white">
        <TeamSidebar />

        <div className="ml-[260px] min-h-screen px-6 py-10 md:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-black">
              Team Roster
            </h1>

            <p className="mt-4 text-red-400">
              {error ||
                "Unable to load roster."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0c] text-white">
      <TeamSidebar />

      <div className="ml-[260px] min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
              TEAM MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Team Roster
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Manage players and staff.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Roster Status
            </p>

            <p className="mt-1 font-bold">
              {data.playerCount} /{" "}
              {data.maximumPlayerCount}{" "}
              Players
            </p>

            <p
              className={`mt-1 text-xs ${
                data.rosterComplete
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {data.rosterComplete
                ? "Roster complete"
                : "4 players required"}
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Main Roster
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Four players are required.
              Player 5 is optional.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {data.slots.map(
              (member, index) => {
                const slot =
                  index + 1;

                return (
                  <PlayerCard
                    key={slot}
                    slot={slot}
                    member={member}
                    onAdd={() => {
                      if (canManage) {
                        openAddPlayer(slot);
                      }
                    }}
                    onEdit={() => {
                      if (member && canManage) {
                        openEdit(member);
                      }
                    }}
                    onDelete={() => {
                      if (member && canManage) {
                        handleDelete(member);
                      }
                    }}
                    deleting={
                      member
                        ? deletingId ===
                          member.id
                        : false
                    }
                    canManage={canManage}
                  />
                );
              }
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
              TEAM LEADERSHIP
            </p>
            <h2 className="mt-2 text-xl font-black">
              Management
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Owner and Manager accounts.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.roster
              .filter(
                (member) =>
                  member.role === "OWNER" ||
                  member.role === "MANAGER"
              )
              .map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-xl font-black text-green-400">
                      {member.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        {member.role}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-black">
                        {member.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-white/30">
                        {member.user?.username
                          ? `@${member.user.username}`
                          : member.ign
                            ? `@${member.ign}`
                            : "Team account"}
                      </p>
                    </div>

                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[9px] font-black uppercase text-green-400">
                      {member.role}
                    </span>
                  </div>

                  {member.role === "MANAGER" &&
                    isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(member)
                        }
                        disabled={
                          deletingId === member.id
                        }
                        className="mt-5 w-full rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {deletingId === member.id
                          ? "Removing..."
                          : "Remove Manager"}
                      </button>
                    )}
                </div>
              ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              Staff
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Coach and Analyst are
              optional.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StaffCard
              title="Coach"
              member={data.coach}
              onAdd={() => {
                if (canManage) {
                  openAddStaff("COACH");
                }
              }}
              onEdit={() => {
                if (data.coach && canManage) {
                  openEdit(data.coach);
                }
              }}
              onDelete={() => {
                if (data.coach && canManage) {
                  handleDelete(data.coach);
                }
              }}
              deleting={
                data.coach
                  ? deletingId ===
                    data.coach.id
                  : false
              }
              canManage={canManage}
            />

            <StaffCard
              title="Analyst"
              member={data.analyst}
              onAdd={() => {
                if (canManage) {
                  openAddStaff("ANALYST");
                }
              }}
              onEdit={() => {
                if (data.analyst && canManage) {
                  openEdit(data.analyst);
                }
              }}
              onDelete={() => {
                if (data.analyst && canManage) {
                  handleDelete(data.analyst);
                }
              }}
              deleting={
                data.analyst
                  ? deletingId ===
                    data.analyst.id
                  : false
              }
              canManage={canManage}
            />
          </div>
        </section>

        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101316] p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                    {editing
                      ? "EDIT MEMBER"
                      : "ADD MEMBER"}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {editing
                      ? editing.role ===
                        "PLAYER"
                        ? `Edit Player ${editing.rosterOrder}`
                        : `Edit ${capitalize(
                            editing.role
                          )}`
                      : form.role ===
                        "PLAYER"
                      ? `Add Player ${form.rosterOrder}`
                      : `Add ${capitalize(
                          form.role
                        )}`}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {!editing && (
                <div className="mb-6 grid grid-cols-3 gap-2">
                  {(
                    [
                      "PLAYER",
                      "COACH",
                      "ANALYST",
                    ] as const
                  ).map(
                    (role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              role,
                              rosterOrder:
                                role ===
                                "PLAYER"
                                  ? current.rosterOrder ||
                                    "1"
                                  : "",
                              competitiveRole:
                                role ===
                                "PLAYER"
                                  ? current.competitiveRole
                                  : "",
                            })
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                          form.role ===
                          role
                            ? "border-green-400 bg-green-400/10 text-green-400"
                            : "border-white/10 text-white/50 hover:bg-white/5"
                        }`}
                      >
                        {capitalize(
                          role
                        )}
                      </button>
                    )
                  )}
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5"
              >
                <Field
                  label="Name"
                  value={
                    form.name
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        name: value,
                      })
                    )
                  }
                  placeholder="Player real name"
                  required
                />

                {form.role !==
                  "PLAYER" && (
                  <>
                    <Field
                      label="Login Username"
                      value={
                        form.username
                      }
                      onChange={(value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            username:
                              value,
                          })
                        )
                      }
                      placeholder="coach_username"
                      required
                    />

                    <Field
                      label={
                        editing
                          ? "New Password (optional)"
                          : "Login Password"
                      }
                      type="password"
                      value={
                        editing
                          ? editPassword
                          : form.password
                      }
                      onChange={(value) => {
                        if (editing) {
                          setEditPassword(value);
                        } else {
                          setForm(
                            (current) => ({
                              ...current,
                              password:
                                value,
                            })
                          );
                        }
                      }}
                      placeholder="Minimum 6 characters"
                      required={!editing}
                    />
                  </>
                )}

                {form.role ===
                  "PLAYER" && (
                  <>
                    <Field
                      label="IGN / Login ID"
                      value={
                        form.ign
                      }
                      onChange={(
                        value
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            ign: value,
                          })
                        )
                      }
                      placeholder="In-game name"
                      required
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Character ID"
                        value={
                          form.characterId
                        }
                        onChange={(
                          value
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              characterId:
                                value,
                            })
                          )
                        }
                        placeholder="Optional"
                      />

                      <SelectField
                        label="Roster Slot"
                        value={
                          form.rosterOrder
                        }
                        onChange={(
                          value
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              rosterOrder:
                                value,
                            })
                          )
                        }
                        options={[
                          {
                            value: "1",
                            label: "Player 1",
                          },
                          {
                            value: "2",
                            label: "Player 2",
                          },
                          {
                            value: "3",
                            label: "Player 3",
                          },
                          {
                            value: "4",
                            label: "Player 4",
                          },
                          {
                            value: "5",
                            label:
                              "Player 5 (Optional)",
                          },
                        ]}
                        required
                      />
                    </div>

                    <SelectField
                      label="Competitive Role"
                      value={
                        form.competitiveRole
                      }
                      onChange={(
                        value
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            competitiveRole:
                              value,
                          })
                        )
                      }
                      options={[
                        {
                          value: "",
                          label:
                            "Select competitive role",
                        },
                        ...competitiveRoleOptions.map(
                          (option) => ({
                            value:
                              option.value,
                            label:
                              option.label,
                          })
                        ),
                      ]}
                    />

                    <Field
                      label={
                        editing
                          ? "New Password (optional)"
                          : "Password"
                      }
                      type="password"
                      value={
                        editing
                          ? editPassword
                          : form.password
                      }
                      onChange={(
                        value
                      ) => {
                        if (
                          editing
                        ) {
                          setEditPassword(
                            value
                          );
                        } else {
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              password:
                                value,
                            })
                          );
                        }
                      }}
                      placeholder="Minimum 6 characters"
                      required={
                        !editing
                      }
                    />
                  </>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      saving
                    }
                    className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-bold text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="flex-1 rounded-xl bg-green-400 px-5 py-3 font-black text-black hover:bg-green-300 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                      ? "Save Changes"
                      : "Add Member"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </div>
        </div>
      </main>
  );
}

function PlayerCard({
  slot,
  member,
  onAdd,
  onEdit,
  onDelete,
  deleting,
  canManage,
}: {
  slot: number;
  member: Member | null;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  canManage: boolean;
}) {
  return (
    <div className="min-h-[280px] rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-white/30">
          PLAYER{" "}
          {String(slot).padStart(
            2,
            "0"
          )}
        </span>

        {slot === 5 && (
          <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-white/40">
            OPTIONAL
          </span>
        )}
      </div>

      {member ? (
        <div className="flex h-[210px] flex-col">
          <div className="flex-1">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-green-400/10 text-xl font-black text-green-400">
              {member.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <h3 className="font-black">
              {member.name}
            </h3>

            <p className="mt-1 text-sm font-bold text-green-400">
              {member.ign}
            </p>

            {member.competitiveRole && (
              <p className="mt-2 inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                {formatCompetitiveRole(
                  member.competitiveRole
                )}
              </p>
            )}

            {member.characterId && (
              <p className="mt-2 text-xs text-white/30">
                ID:{" "}
                {member.characterId}
              </p>
            )}
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 disabled:opacity-50"
              >
                {deleting
                  ? "..."
                  : "Remove"}
              </button>
            </div>
          )}
        </div>
      ) : canManage ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-[210px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-white/30 transition hover:border-green-400/40 hover:bg-green-400/5 hover:text-green-400"
        >
          <span className="text-3xl">
            +
          </span>

          <span className="mt-2 text-sm font-bold">
            Add Player
          </span>
        </button>
      ) : (
        <div className="flex h-[210px] items-center justify-center rounded-xl border border-dashed border-white/5 text-xs font-bold uppercase tracking-wider text-white/15">
          Empty Slot
        </div>
      )}
    </div>
  );
}

function StaffCard({
  title,
  member,
  onAdd,
  onEdit,
  onDelete,
  deleting,
  canManage,
}: {
  title: string;
  member: Member | null;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  canManage: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/30">
          STAFF
        </p>

        <h3 className="mt-1 text-xl font-black">
          {title}
        </h3>
      </div>

      {member ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 font-black">
              {member.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="font-bold">
                {member.name}
              </p>

              <p className="text-xs text-white/30">
                {title}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 disabled:opacity-50"
              >
                {deleting
                  ? "..."
                  : "Remove"}
              </button>
            </div>
          )}
        </div>
      ) : canManage ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-xl border border-dashed border-white/10 px-5 py-8 text-sm font-bold text-white/30 hover:border-green-400/40 hover:bg-green-400/5 hover:text-green-400"
        >
          + Add {title}
        </button>
      ) : (
        <div className="rounded-xl border border-dashed border-white/5 px-5 py-8 text-center text-xs font-bold uppercase tracking-wider text-white/15">
          Not assigned
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/70">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        required={required}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/70">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        className="w-full rounded-xl border border-white/10 bg-[#101316] px-4 py-3 text-white outline-none focus:border-green-400/50"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}

function formatCompetitiveRole(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function capitalize(
  value: string
) {
  return (
    value.charAt(0) +
    value
      .slice(1)
      .toLowerCase()
  );
}