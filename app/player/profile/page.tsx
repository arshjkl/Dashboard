"use client";

import { useEffect, useState } from "react";

import TeamSidebar from "@/components/team-sidebar";

type TeamUser = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
};

type ProfileData = {
  authenticated: boolean;

  user: {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
  };

  team: {
    id: string;
    name: string;
    slug: string;
  } | null;

  roles: string[];

  teamUsers: TeamUser[];
};

type ManagerData = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
};

type ManagerResponse = {
  success: boolean;
  manager: ManagerData | null;
  members: TeamUser[];
   error?: string;
};

type ProfileForm = {
  displayName: string;
  username: string;
  password: string;
};

type ManagerForm = {
  displayName: string;
  username: string;
  password: string;
};

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [manager, setManager] =
    useState<ManagerData | null>(null);

  const [managerMembers, setManagerMembers] =
    useState<TeamUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [appointExistingOpen, setAppointExistingOpen] =
    useState(false);

  const [createManagerOpen, setCreateManagerOpen] =
    useState(false);

  const [selectedMemberId, setSelectedMemberId] =
    useState("");

  const [profileForm, setProfileForm] =
    useState<ProfileForm>({
      displayName: "",
      username: "",
      password: "",
    });

  const [managerForm, setManagerForm] =
    useState<ManagerForm>({
      displayName: "",
      username: "",
      password: "",
    });

  async function loadProfile() {
    try {
      const response = await fetch(
        "/api/account/profile",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load profile."
        );
      }

      setProfile(result);

      setProfileForm({
        displayName:
          result.user.displayName,
        username:
          result.user.username,
        password: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load profile."
      );
    }
  }

  async function loadManager() {
    try {
      const response = await fetch(
        "/api/team/manager",
        {
          cache: "no-store",
        }
      );

      const result: ManagerResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load Manager information."
        );
      }

      setManager(
        result.manager
      );

      setManagerMembers(
        Array.isArray(result.members)
          ? result.members
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Manager information."
      );
    }
  }

  async function loadEverything() {
    setLoading(true);
    setError("");

    await Promise.all([
      loadProfile(),
      loadManager(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadEverything();
  }, []);

  const roles =
    profile?.roles || [];

  const isOwner =
    roles.includes("OWNER");

  const isManager =
    roles.includes("MANAGER");

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/account/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            displayName:
              profileForm.displayName.trim(),
            username:
              profileForm.username.trim(),
            ...(profileForm.password
              ? {
                  password:
                    profileForm.password,
                }
              : {}),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update profile."
        );
      }

      setEditingProfile(false);

      setProfileForm((current) => ({
        ...current,
        password: "",
      }));

      setSuccess(
        "Profile updated successfully."
      );

      await loadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function appointExistingMember() {
    if (!selectedMemberId) {
      setError(
        "Select a team member first."
      );
      return;
    }

    const selected =
      managerMembers.find(
        (member) =>
          member.id ===
          selectedMemberId
      );

    if (!selected) {
      setError(
        "Selected team member was not found."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Appoint ${selected.displayName} as Manager?`
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/team/manager",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action:
              "appoint-existing",
            userId:
              selectedMemberId,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to appoint Manager."
        );
      }

      setSuccess(
        `${selected.displayName} has been appointed Manager.`
      );

      setSelectedMemberId("");
      setAppointExistingOpen(false);

      await loadManager();
      await loadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to appoint Manager."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createManager() {
    if (
      managerForm.displayName.trim()
        .length < 2
    ) {
      setError(
        "Display name must be at least 2 characters."
      );
      return;
    }

    if (
      managerForm.username.trim()
        .length < 2
    ) {
      setError(
        "Username must be at least 2 characters."
      );
      return;
    }

    if (
      managerForm.password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Create ${managerForm.displayName} as a new Manager account?`
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/team/manager",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "create",
            displayName:
              managerForm.displayName.trim(),
            username:
              managerForm.username.trim(),
            password:
              managerForm.password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create Manager."
        );
      }

      setSuccess(
        `${result.manager.displayName} has been created and appointed Manager.`
      );

      setManagerForm({
        displayName: "",
        username: "",
        password: "",
      });

      setCreateManagerOpen(false);

      await loadManager();
      await loadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Manager."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resignAsManager() {
    if (!isManager) {
      return;
    }

    const confirmed =
      window.confirm(
        "Resign as Manager? You will remain Owner if you hold the Owner role."
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/team/manager",
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to resign as Manager."
        );
      }

      setSuccess(
        "You have resigned as Manager."
      );

      await loadManager();
      await loadProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resign as Manager."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050708] text-white">
        <TeamSidebar />

        <div className="p-4 sm:p-6 md:ml-[260px] lg:p-8">
          <p className="text-white/40">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050708] text-white">
        <TeamSidebar />

        <div className="p-4 sm:p-6 md:ml-[260px] lg:p-8">
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-300">
            {error ||
              "Unable to load profile."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050708] text-white">
      <TeamSidebar />

      <div className="relative min-h-screen md:ml-[260px]">
        <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_80%_0%,rgba(74,222,128,0.07),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(34,211,238,0.035),transparent_25%)]" />
        {/* HEADER */}

        <header className="relative border-b border-white/10 bg-[#080c0d]/90 px-4 py-6 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
                ACCOUNT / OPERATOR PROFILE
              </p>
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              My Profile
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/35">
              Identity, account security and team responsibilities.
            </p>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
          {/* ALERTS */}

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm font-bold text-green-300">
              {success}
            </div>
          )}

          {/* ACCOUNT CARD */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-xl sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30">
                  ACCOUNT
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {profile.user.displayName}
                </h2>

                <p className="mt-1 text-white/40">
                  @{profile.user.username}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-green-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-green-400"
                    >
                      {formatRole(role)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProfile(true);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-xl border border-green-400/25 bg-green-400/10 px-5 py-3 text-sm font-black text-green-400 transition hover:border-green-400/50 hover:bg-green-400/15 hover:text-green-300"
              >
                Edit Profile
              </button>
            </div>
          </section>

          {/* TEAM */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-green-400/15 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30">
              TEAM
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {profile.team?.name ||
                "No Team"}
            </h2>

            {profile.team?.slug && (
              <p className="mt-1 text-sm text-white/30">
                {profile.team.slug}
              </p>
            )}
          </section>

          {/* TEAM LEADERSHIP */}

          {isOwner || isManager ? (
            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
                  TEAM LEADERSHIP
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Leadership
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                  Owner and Manager are administrative
                  roles separate from the competitive
                  roster.
                </p>
              </div>

              {/* CURRENT ROLES */}

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <LeadershipCard
                  title="Owner"
                  name={
                    profile.team?.name
                      ? findRoleHolderName(
                          profile.teamUsers,
                          "OWNER"
                        ) ||
                        (
                          roles.includes(
                            "OWNER"
                          )
                            ? profile.user
                                .displayName
                            : "Not assigned"
                        )
                      : "Not assigned"
                  }
                  active={true}
                />

                <LeadershipCard
                  title="Manager"
                  name={
                    manager?.displayName ||
                    "No Manager appointed"
                  }
                  active={
                    Boolean(manager)
                  }
                />
              </div>

              {/* OWNER CONTROLS */}

              {isOwner && (
                <div className="mt-8">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                    MANAGER MANAGEMENT
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {/* EXISTING MEMBER */}

                    <button
                      type="button"
                      onClick={() => {
                        setAppointExistingOpen(
                          true
                        );
                        setCreateManagerOpen(
                          false
                        );
                        setError("");
                        setSuccess("");
                      }}
                      className="group rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-left transition hover:border-green-400/40 hover:bg-green-400/5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-400/10 text-2xl text-green-400">
                        +
                      </div>

                      <h3 className="mt-4 text-lg font-black">
                        Appoint Existing Member
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-white/40">
                        Choose someone already in the
                        team and give them the Manager
                        role.
                      </p>
                    </button>

                    {/* NEW ACCOUNT */}

                    <button
                      type="button"
                      onClick={() => {
                        setCreateManagerOpen(
                          true
                        );
                        setAppointExistingOpen(
                          false
                        );
                        setError("");
                        setSuccess("");
                      }}
                      className="group rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-left transition hover:border-green-400/40 hover:bg-green-400/5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-400/10 text-2xl text-green-400">
                        +
                      </div>

                      <h3 className="mt-4 text-lg font-black">
                        Create Manager Account
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-white/40">
                        Create a completely new team
                        account and appoint it as Manager.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* CURRENT MANAGER ACTION */}

              {isManager && (
                <div className="mt-8 rounded-2xl border border-green-400/15 bg-green-400/[0.035] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400/70">
                    YOUR MANAGER ROLE
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    {profile.user.displayName}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    You currently hold the Manager role.
                    If another Manager has already been
                    appointed, you can resign and remain
                    Owner if you hold the Owner role.
                  </p>

                  <button
                    type="button"
                    onClick={resignAsManager}
                    disabled={saving}
                    className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Processing..."
                      : "Resign as Manager"}
                  </button>
                </div>
              )}
            </section>
          ) : null}

          {/* SECURITY */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-green-400/15 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30">
              SECURITY
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Account Security
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Change your username, display name or
              password using Edit Profile.
            </p>
          </section>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}

      {editingProfile && (
        <Modal
          title="Edit Profile"
          subtitle="Update your account details."
          onClose={() =>
            setEditingProfile(false)
          }
        >
          <div className="space-y-5">
            <Field
              label="Display Name"
              value={
                profileForm.displayName
              }
              onChange={(value) =>
                setProfileForm(
                  (current) => ({
                    ...current,
                    displayName:
                      value,
                  })
                )
              }
            />

            <Field
              label="Username"
              value={
                profileForm.username
              }
              onChange={(value) =>
                setProfileForm(
                  (current) => ({
                    ...current,
                    username:
                      value,
                  })
                )
              }
            />

            <Field
              label="New Password"
              type="password"
              value={
                profileForm.password
              }
              placeholder="Leave empty to keep current password"
              onChange={(value) =>
                setProfileForm(
                  (current) => ({
                    ...current,
                    password:
                      value,
                  })
                )
              }
            />

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="w-full rounded-xl border border-green-400/25 bg-green-400/10 px-5 py-3 font-black text-green-400 transition hover:border-green-400/50 hover:bg-green-400/15 hover:text-green-300 disabled:opacity-40"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* APPOINT EXISTING */}

      {appointExistingOpen && (
        <Modal
          title="Appoint Existing Member"
          subtitle="Choose an existing team account to become Manager."
          onClose={() => {
            setAppointExistingOpen(
              false
            );
            setSelectedMemberId("");
          }}
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-white/70">
                Team Member
              </label>

              <select
                value={
                  selectedMemberId
                }
                onChange={(event) =>
                  setSelectedMemberId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b0e11] px-4 py-3 text-sm font-bold text-white outline-none focus:border-green-400/50"
              >
                <option value="">
                  Select team member
                </option>

                {managerMembers.map(
                  (member) => (
                    <option
                      key={member.id}
                      value={
                        member.id
                      }
                    >
                      {member.displayName}{" "}
                      — @
                      {
                        member.username
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedMemberId && (
              <SelectedMemberPreview
                member={
                  managerMembers.find(
                    (member) =>
                      member.id ===
                      selectedMemberId
                  ) || null
                }
              />
            )}

            <button
              type="button"
              onClick={
                appointExistingMember
              }
              disabled={
                saving ||
                !selectedMemberId
              }
              className="w-full rounded-xl bg-green-400 px-5 py-3 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Appointing..."
                : "Appoint as Manager"}
            </button>
          </div>
        </Modal>
      )}

      {/* CREATE MANAGER */}

      {createManagerOpen && (
        <Modal
          title="Create Manager Account"
          subtitle="Create a new team account and appoint it as Manager."
          onClose={() => {
            setCreateManagerOpen(
              false
            );
            setManagerForm({
              displayName: "",
              username: "",
              password: "",
            });
          }}
        >
          <div className="space-y-5">
            <Field
              label="Display Name"
              value={
                managerForm.displayName
              }
              onChange={(value) =>
                setManagerForm(
                  (current) => ({
                    ...current,
                    displayName:
                      value,
                  })
                )
              }
              placeholder="Manager name"
            />

            <Field
              label="Username"
              value={
                managerForm.username
              }
              onChange={(value) =>
                setManagerForm(
                  (current) => ({
                    ...current,
                    username:
                      value,
                  })
                )
              }
              placeholder="Login username"
            />

            <Field
              label="Password"
              type="password"
              value={
                managerForm.password
              }
              onChange={(value) =>
                setManagerForm(
                  (current) => ({
                    ...current,
                    password:
                      value,
                  })
                )
              }
              placeholder="Minimum 6 characters"
            />

            <button
              type="button"
              onClick={createManager}
              disabled={saving}
              className="w-full rounded-xl bg-green-400 px-5 py-3 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Creating..."
                : "Create & Appoint Manager"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* -------------------------------------------------- */
/* COMPONENTS */
/* -------------------------------------------------- */

function LeadershipCard({
  title,
  name,
  active,
}: {
  title: string;
  name: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
          {title}
        </p>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
            active
              ? "bg-green-400/10 text-green-400"
              : "bg-white/5 text-white/30"
          }`}
        >
          {active
            ? title
            : "Not assigned"}
        </span>
      </div>

      <p className="mt-4 text-xl font-black">
        {name}
      </p>
    </div>
  );
}

function SelectedMemberPreview({
  member,
}: {
  member: TeamUser | null;
}) {
  if (!member) {
    return null;
  }

  return (
    <div className="rounded-xl border border-green-400/10 bg-green-400/[0.03] p-4">
      <p className="text-xs font-black uppercase tracking-wider text-green-400/70">
        Selected
      </p>

      <p className="mt-2 font-black">
        {member.displayName}
      </p>

      <p className="mt-1 text-sm text-white/40">
        @{member.username}
      </p>

      {member.roles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {member.roles.map(
            (role) => (
              <span
                key={role}
                className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase text-white/40"
              >
                {formatRole(role)}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0f0e] p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
              TEAM
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-white/30 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-7">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-green-400/50"
      />
    </label>
  );
}

function findRoleHolderName(
  users: TeamUser[],
  role: string
) {
  const holder = users.find(
    (user) =>
      user.roles.includes(role)
  );

  return holder?.displayName || null;
}

function formatRole(
  role: string
) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}