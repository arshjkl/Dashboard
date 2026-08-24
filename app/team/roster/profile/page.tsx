"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import TeamSidebar from "@/components/team-sidebar";

type Member = {
  id: string;
  name: string;
  ign: string | null;
  characterId: string | null;
  role: string;
  competitiveRole:
    | string
    | null;
  rosterOrder:
    | number
    | null;
  photoUrl:
    | string
    | null;
};

type Person = {
  id: string;
  username: string;
  displayName: string;
  roles: {
    role: string;
  }[];
} | null;

type Team = {
  id: string;
  name: string;
  slug: string;
  logoUrl:
    | string
    | null;
  description:
    | string
    | null;
};

type ProfileResponse = {
  success: boolean;
  team: Team;
  owner: Person;
  manager: Person;
  roster: Member[];
  session: {
    userId: string;
    roles: string[];
    isOwner: boolean;
  };
};

export default function TeamProfilePage() {
  const [data, setData] =
    useState<ProfileResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [name, setName] =
    useState("");

  const [logoUrl, setLogoUrl] =
    useState("");

  const [description, setDescription] =
    useState("");

  async function loadProfile() {
    try {
      const response =
        await fetch(
          "/api/team/profile",
          {
            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load team profile."
        );
      }

      setData(result);

      setName(
        result.team.name
      );

      setLogoUrl(
        result.team.logoUrl ||
          ""
      );

      setDescription(
        result.team.description ||
          ""
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load team profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/team/profile",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,
              logoUrl,
              description,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update team profile."
        );
      }

      setEditing(false);

      await loadProfile();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update team profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080a0c] text-white">
        <TeamSidebar />

        <div className="ml-[260px] p-8">
          <p className="text-white/40">
            Loading team profile...
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#080a0c] text-white">
        <TeamSidebar />

        <div className="ml-[260px] p-8">
          <p className="text-red-400">
            {error ||
              "Unable to load team."}
          </p>
        </div>
      </main>
    );
  }

  const players =
    data.roster
      .filter(
        (member) =>
          member.role ===
          "PLAYER"
      )
      .sort(
        (a, b) =>
          (a.rosterOrder ??
            99) -
          (b.rosterOrder ??
            99)
      );

  const staff =
    data.roster.filter(
      (member) =>
        member.role ===
          "COACH" ||
        member.role ===
          "ANALYST"
    );

  return (
    <main className="min-h-screen bg-[#080a0c] text-white">
      <TeamSidebar />

      <div className="ml-[260px] min-h-screen">
        <header className="border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
                TEAM PROFILE
              </p>

              <h1 className="mt-2 text-3xl font-black">
                {data.team.name}
              </h1>
            </div>

            {data.session
              .isOwner && (
              <button
                type="button"
                onClick={() =>
                  setEditing(
                    true
                  )
                }
                className="rounded-xl bg-green-400 px-5 py-3 text-sm font-black text-black hover:bg-green-300"
              >
                Edit Team Profile
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-8 p-8">
          {/* TEAM HERO */}

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                  {data.team
                    .logoUrl ? (
                    <img
                      src={
                        data.team
                          .logoUrl
                      }
                      alt={
                        data.team
                          .name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-black text-green-400">
                      {data.team.name
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                    BGMI ESPORTS TEAM
                  </p>

                  <h2 className="mt-2 text-4xl font-black">
                    {data.team.name}
                  </h2>

                  {data.team
                    .description && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                      {
                        data
                          .team
                          .description
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* OWNER / MANAGER */}

          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                ADMINISTRATION
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Team Leadership
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PersonCard
                label="OWNER"
                person={
                  data.owner
                }
              />

              <PersonCard
                label="MANAGER"
                person={
                  data.manager
                }
              />
            </div>
          </section>

          {/* ROSTER */}

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                  COMPETITIVE ROSTER
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Main Roster
                </h2>
              </div>

              <Link
                href="/team/roster"
                className="text-sm font-bold text-green-400 hover:text-green-300"
              >
                Manage Roster →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {players.map(
                (player) => (
                  <PlayerProfileCard
                    key={
                      player.id
                    }
                    player={
                      player
                    }
                  />
                )
              )}

              {players.length ===
                0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <p className="font-bold text-white/40">
                    No players have
                    been added yet.
                  </p>

                  <Link
                    href="/team/roster"
                    className="mt-3 inline-block text-sm font-bold text-green-400"
                  >
                    Build Roster →
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* STAFF */}

          {staff.length >
            0 && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                  STAFF
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Support Staff
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {staff.map(
                  (member) => (
                    <div
                      key={
                        member.id
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                        {
                          member.role
                        }
                      </p>

                      <p className="mt-2 text-lg font-black">
                        {
                          member.name
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* FUTURE SECTIONS */}

          <section className="grid gap-4 md:grid-cols-2">
            <PlaceholderCard
              title="Upcoming Tournaments"
              description="Tournament scheduling will appear here."
            />

            <PlaceholderCard
              title="Past Tournaments"
              description="Historical tournament records will appear here."
            />
          </section>
        </div>
      </div>

      {/* EDIT MODAL */}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#101316] p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                  OWNER ONLY
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Edit Team Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(
                    false
                  )
                }
                className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <Field
                label="Team Name"
                value={
                  name
                }
                onChange={
                  setName
                }
              />

              <Field
                label="Team Logo URL"
                value={
                  logoUrl
                }
                onChange={
                  setLogoUrl
                }
                placeholder="https://..."
              />

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/70">
                  Description
                </span>

                <textarea
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event
                        .target
                        .value
                    )
                  }
                  rows={4}
                  placeholder="Describe your team..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-green-400/50"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      false
                    )
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-bold text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveProfile
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-xl bg-green-400 px-5 py-3 font-black text-black hover:bg-green-300 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PersonCard({
  label,
  person,
}: {
  label: string;
  person: Person;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-white/30">
        {label}
      </p>

      {person ? (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-400/10 font-black text-green-400">
            {person.displayName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p className="font-black">
              {
                person.displayName
              }
            </p>

            <p className="mt-1 text-xs text-white/30">
              @{person.username}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/30">
          Not assigned
        </p>
      )}
    </div>
  );
}

function PlayerProfileCard({
  player,
}: {
  player: Member;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-black text-white/30">
          {player.rosterOrder
            ? `PLAYER ${String(
                player.rosterOrder
              ).padStart(
                2,
                "0"
              )}`
            : "PLAYER"}
        </span>

        {player.competitiveRole && (
          <span className="rounded-full bg-green-400/10 px-2 py-1 text-[9px] font-black uppercase text-green-400">
            {formatRole(
              player.competitiveRole
            )}
          </span>
        )}
      </div>

      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-green-400/10 text-xl font-black text-green-400">
        {player.photoUrl ? (
          <img
            src={
              player.photoUrl
            }
            alt={
              player.name
            }
            className="h-full w-full object-cover"
          />
        ) : (
          player.name
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <h3 className="mt-4 font-black">
        {player.name}
      </h3>

      <p className="mt-1 text-sm font-bold text-green-400">
        {player.ign ||
          "No IGN"}
      </p>

      {player.characterId && (
        <p className="mt-2 text-xs text-white/30">
          ID:{" "}
          {
            player.characterId
          }
        </p>
      )}
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-white/30">
        COMING SOON
      </p>

      <h3 className="mt-2 text-xl font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm text-white/40">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/70">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-green-400/50"
      />
    </label>
  );
}

function formatRole(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}