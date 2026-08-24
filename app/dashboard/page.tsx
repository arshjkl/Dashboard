"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import TeamSidebar from "@/components/team-sidebar";
import CharacterAvatar from "@/components/team/character-avatar";

/* =========================================================
   TYPES
========================================================= */

type MeResponse = {
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
  };

  roles: string[];

  memberProfile: {
    id: string;
    name: string;
    ign: string | null;
    characterId: string | null;
    role: string;
    competitiveRole: string | null;
    isMainPlayer: boolean;
    rosterOrder: number | null;
    photoUrl: string | null;
    avatarUrl?: string | null;
  } | null;
};

type TeamMember = {
  id: string;
  name: string;
  ign: string | null;
  characterId: string | null;
  role: string;
  competitiveRole: string | null;
  photoUrl: string | null;
  avatarUrl: string | null;
  isMainPlayer: boolean;
  rosterOrder: number | null;
  userId: string | null;
};

type TournamentStatus =
  | "UPCOMING"
  | "LIVE"
  | "QUALIFIED"
  | "COMPLETED"
  | "CANCELLED";

type TournamentRound = {
  id: string;
  tournamentId: string;
  name: string;
  roundNumber: number;
  startAt: string;
  endAt: string | null;
  slotNumber: string | null;
  pointSystem: string | null;
  roomId: string | null;
  roomPassword: string | null;
};

type Tournament = {
  id: string;
  teamId: string;
  name: string;
  organizer: string | null;
  description: string | null;
  status: TournamentStatus;
  startAt: string;
  endAt: string | null;
  slotNumber: string | null;
  pointSystem: string | null;
  roomId: string | null;
  roomPassword: string | null;
  finalPosition: number | null;
  totalPoints: number | null;
  createdAt: string;
  updatedAt: string;
  rounds?: TournamentRound[];
};

type TournamentResponse = {
  success: boolean;
  tournaments?: Tournament[];
  error?: string;
};

type RosterResponse = {
  success: boolean;
  members?: TeamMember[];
  roster?: TeamMember[];
  error?: string;
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function DashboardPage() {
  const [data, setData] =
    useState<MeResponse | null>(null);

  const [members, setMembers] =
    useState<TeamMember[]>([]);

  const [tournaments, setTournaments] =
    useState<Tournament[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [now, setNow] =
    useState(Date.now());

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          meResponse,
          rosterResponse,
          tournamentResponse,
        ] = await Promise.all([
          fetch("/api/me", {
            cache: "no-store",
            credentials: "include",
          }),

          fetch("/api/team/roster", {
            cache: "no-store",
            credentials: "include",
          }),

          fetch("/api/tournaments", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const meResult =
          await meResponse.json();

        if (
          !meResponse.ok ||
          !meResult.authenticated
        ) {
          throw new Error(
            "Unable to load your profile."
          );
        }

        setData(meResult);

        /* ================================
           ROSTER
        ================================= */

        if (rosterResponse.ok) {
          const rosterResult: RosterResponse =
            await rosterResponse.json();

          const roster =
            Array.isArray(
              rosterResult.members
            )
              ? rosterResult.members
              : Array.isArray(
                    rosterResult.roster
                  )
                ? rosterResult.roster
                : [];

          if (
            rosterResult.success
          ) {
            setMembers(roster);
          }
        }

        /* ================================
           TOURNAMENTS
        ================================= */

        if (tournamentResponse.ok) {
          const tournamentResult: TournamentResponse =
            await tournamentResponse.json();

          if (
            tournamentResult.success &&
            Array.isArray(
              tournamentResult.tournaments
            )
          ) {
            setTournaments(
              tournamentResult.tournaments
            );
          }
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

    const refresh =
      window.setInterval(
        loadDashboard,
        60_000
      );

    return () =>
      window.clearInterval(refresh);
  }, []);

  /* ================================
     LIVE CLOCK
  ================================= */

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1_000);

    return () =>
      window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#02070B] text-white">
        <TeamSidebar />

        <div className="min-h-screen lg:ml-[260px]">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin border-2 border-cyan-400/20 border-t-cyan-400" />

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400">
                Initializing Command Center
              </p>

              <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-slate-600">
                Establishing secure uplink...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#02070B] text-white">
        <TeamSidebar />

        <div className="min-h-screen p-5 lg:ml-[260px] lg:p-8">
          <div className="border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
              SYSTEM ERROR
            </p>

            <p className="mt-3 text-sm text-slate-400">
              {error ||
                "Unable to load command center."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      data={data}
      members={members}
      tournaments={tournaments}
      now={now}
    />
  );
}

/* =========================================================
   SHELL
========================================================= */

function DashboardShell({
  data,
  members,
  tournaments,
  now,
}: {
  data: MeResponse;
  members: TeamMember[];
  tournaments: Tournament[];
  now: number;
}) {
  const upcoming = useMemo(
    () =>
      tournaments
        .filter(
          (t) =>
            t.status === "UPCOMING"
        )
        .sort(
          (a, b) =>
            new Date(
              a.startAt
            ).getTime() -
            new Date(
              b.startAt
            ).getTime()
        ),
    [tournaments]
  );

  const live = tournaments.filter(
    (t) =>
      t.status === "LIVE"
  );

  const qualified =
    tournaments.filter(
      (t) =>
        t.status === "QUALIFIED"
    );

  const completed =
    tournaments.filter(
      (t) =>
        t.status === "COMPLETED"
    );

  const currentTournament =
    live[0] ||
    qualified[0] ||
    null;

  const owner =
    members.find(
      (member) =>
        member.role === "OWNER"
    ) || null;

  const manager =
    members.find(
      (member) =>
        member.role === "MANAGER"
    ) || null;

  const roster = members
    .filter(
      (member) =>
        member.role === "PLAYER"
    )
    .sort(
      (a, b) =>
        (a.rosterOrder ?? 999) -
        (b.rosterOrder ?? 999)
    );

  const staff = members.filter(
    (member) =>
      member.role !== "PLAYER" &&
      member.role !== "OWNER" &&
      member.role !== "MANAGER"
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#02070B] text-slate-100">
      <TeamSidebar />

      <div className="min-h-screen lg:ml-[260px]">
        {/* =================================================
            TOP SYSTEM HEADER
        ================================================= */}

        <header className="relative border-b border-cyan-400/10 bg-[#040B11]">
          {/* scanlines */}

          <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#67e8f9_4px)]" />

          <div className="relative mx-auto max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              {/* TEAM IDENTITY */}

              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
                  <span className="text-xl font-black text-cyan-300">
                    {data.team.name
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-300" />

                  <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-300" />

                  <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-300" />

                  <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-300" />
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-500">
                    TEAM COMMAND
                  </p>

                  <h1 className="truncate text-xl font-black uppercase tracking-wider sm:text-2xl">
                    {data.team.name}
                  </h1>

                  <p className="truncate text-[8px] uppercase tracking-[0.2em] text-slate-600">
                    SECURE OPERATIONS NETWORK
                  </p>
                </div>
              </div>

              {/* SYSTEM INFO */}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <SystemMetric
                  label="UPLINK"
                  value="STABLE"
                  status="good"
                />

                <SystemMetric
                  label="OPERATORS"
                  value={`${members.length}`}
                />

                <SystemMetric
                  label="ROSTER"
                  value={`${roster.length}/5`}
                />

                <SystemMetric
                  label="LOCAL TIME"
                  value={formatTime(
                    now
                  )}
                />
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
          {/* =================================================
              WELCOME / MISSION HEADER
          ================================================= */}

          <section className="relative mb-6 overflow-hidden border border-cyan-400/10 bg-[#061019]">
            <HudCorners />

            <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

                  <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
                    OPERATIONAL STATUS
                  </p>
                </div>

                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
                  Welcome,{" "}
                  <span className="text-cyan-300">
                    {data.user.displayName}
                  </span>
                </h2>

                <p className="mt-3 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                  Command center access established.
                  Monitor tournaments, squad readiness,
                  team leadership and competitive
                  operations from a single interface.
                </p>
              </div>

              <div className="border border-cyan-400/10 bg-black/20 p-5 lg:min-w-[240px]">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">
                  CURRENT SESSION
                </p>

                <p className="mt-3 text-lg font-black uppercase text-white">
                  {getPrimaryRole(
                    data.roles
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    AUTHENTICATED
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
            {/* LEFT */}
            <div className="space-y-6">
              {/* MISSION CONTROL */}

              <MissionControl
                tournament={
                  currentTournament
                }
                upcoming={
                  upcoming[0] ||
                  null
                }
                now={now}
              />

              {/* TEAM INTEL */}

              <TeamIntel
                owner={owner}
                manager={manager}
                staff={staff}
              />

              {/* TOURNAMENT STATUS */}

              <TournamentOverview
                upcoming={upcoming}
                live={live}
                qualified={qualified}
                completed={completed}
              />
            </div>

            {/* RIGHT */}
            <div>
              <SquadRoster
                roster={roster}
                members={members}
              />
            </div>
          </div>

          {/* =================================================
              LOWER SYSTEM PANELS
          ================================================= */}

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <IntelPanel
              label="ENEMY PRESENCE"
              value={
                currentTournament
                  ? "MONITORING"
                  : "NONE"
              }
              description={
                currentTournament
                  ? "Tournament activity detected."
                  : "No active tournament."
              }
              type={
                currentTournament
                  ? "warning"
                  : "normal"
              }
            />

            <IntelPanel
              label="TEAM READINESS"
              value={
                roster.length >= 4
                  ? "READY"
                  : "INCOMPLETE"
              }
              description={`${roster.length} registered player${roster.length === 1 ? "" : "s"} in active roster.`}
              type={
                roster.length >= 4
                  ? "good"
                  : "warning"
              }
            />

            <IntelPanel
              label="COMMS NETWORK"
              value="STANDBY"
              description="Communication systems ready."
              type="normal"
            />
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="mt-6 border border-cyan-400/10 bg-[#040B11]">
            <div className="border-b border-cyan-400/10 px-5 py-4">
              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-500">
                SYSTEM ACCESS
              </p>

              <h2 className="mt-1 text-lg font-black uppercase">
                Operations
              </h2>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-cyan-400/10 sm:grid-cols-4 sm:divide-y-0">
              <QuickAction
                href="/team/profile"
                label="TEAM PROFILE"
                code="01"
              />

              <QuickAction
                href="/team/roster"
                label="SQUAD ROSTER"
                code="02"
              />

              <QuickAction
                href="/tournaments"
                label="TOURNAMENTS"
                code="03"
              />

              <QuickAction
                href="/chat"
                label="COMMS"
                code="04"
                comingSoon
              />
            </div>
          </section>

          {/* FOOTER */}

          <div className="mt-6 flex flex-col gap-2 border-t border-cyan-400/5 pt-4 text-[7px] font-bold uppercase tracking-[0.25em] text-slate-700 sm:flex-row sm:justify-between">
            <span>
              {data.team.name} // COMMAND NETWORK
            </span>

            <span>
              ALL SYSTEMS NOMINAL
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   MISSION CONTROL
========================================================= */

function MissionControl({
  tournament,
  upcoming,
  now,
}: {
  tournament: Tournament | null;
  upcoming: Tournament | null;
  now: number;
}) {
  const event =
    tournament ||
    upcoming;

  return (
    <section className="relative overflow-hidden border border-cyan-400/15 bg-[#061019]">
      <HudCorners />

      <div className="border-b border-cyan-400/10 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
              // MISSION CONTROL
            </p>

            <h2 className="mt-1 text-lg font-black uppercase sm:text-xl">
              Tournament Operations
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-600">
              SYSTEM CLOCK
            </p>

            <p className="font-mono text-xs text-cyan-400">
              {formatTime(now)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {event ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  status={event.status}
                />

                {event.organizer && (
                  <span className="border border-white/5 bg-white/[0.02] px-2 py-1 text-[7px] font-black uppercase tracking-wider text-slate-500">
                    {event.organizer}
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                {event.name}
              </h3>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
                {event.description ||
                  getTournamentDescription(
                    event
                  )}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniMetric
                  label="DATE"
                  value={formatShortDate(
                    event.startAt
                  )}
                />

                <MiniMetric
                  label="TIME"
                  value={formatTime(
                    new Date(
                      event.startAt
                    ).getTime()
                  )}
                />

                <MiniMetric
                  label="SLOT"
                  value={
                    event.slotNumber ||
                    "—"
                  }
                />

                <MiniMetric
                  label="ROUND"
                  value={getRoundLabel(
                    event
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 lg:min-w-[230px]">
              <div className="border border-cyan-400/20 bg-cyan-400/5 p-5 text-center">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-cyan-500">
                  {event.status ===
                  "LIVE"
                    ? "TIME IN OPERATION"
                    : "TIME TO DEPLOY"}
                </p>

                <p className="mt-2 font-mono text-2xl font-black tracking-wider text-cyan-300 sm:text-3xl">
                  {event.status ===
                  "LIVE"
                    ? getLiveDuration(
                        event.startAt
                      )
                    : getCountdown(
                        event.startAt
                      )}
                </p>
              </div>

              <Link
                href="/tournaments"
                className="group flex items-center justify-center gap-3 border border-cyan-400/30 bg-cyan-400/5 px-5 py-4 text-[9px] font-black uppercase tracking-[0.25em] text-cyan-300 transition hover:bg-cyan-400/10 hover:shadow-[0_0_25px_rgba(34,211,238,0.1)]"
              >
                <span>OPEN TOURNAMENT CONTROL</span>

                <span className="transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center border border-cyan-400/10 bg-cyan-400/5">
              <span className="text-2xl text-cyan-400/40">
                ◈
              </span>
            </div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
              NO ACTIVE MISSION
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-700">
              No tournament has been scheduled.
              Tournament operations will appear here
              once an event is created.
            </p>

            <Link
              href="/tournaments"
              className="mt-5 border border-cyan-400/20 px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-400/5"
            >
              VIEW TOURNAMENTS
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   SQUAD ROSTER
========================================================= */

function SquadRoster({
  roster,
  members,
}: {
  roster: TeamMember[];
  members: TeamMember[];
}) {
  const visibleRoster =
    roster.slice(0, 5);

  return (
    <section className="relative overflow-hidden border border-cyan-400/15 bg-[#061019]">
      <HudCorners />

      <div className="border-b border-cyan-400/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
              // SQUAD ROSTER
            </p>

            <h2 className="mt-1 text-lg font-black uppercase">
              Active Squad
            </h2>
          </div>

          <div className="font-mono text-sm font-black text-cyan-400">
            {visibleRoster.length}/5
          </div>
        </div>
      </div>

      <div className="p-3">
        {visibleRoster.length > 0 ? (
          <div className="space-y-2">
            {visibleRoster.map(
              (member, index) => (
                <RosterCard
                  key={member.id}
                  member={member}
                  number={
                    member.rosterOrder ||
                    index + 1
                  }
                />
              )
            )}

            {Array.from({
              length:
                Math.max(
                  0,
                  5 -
                    visibleRoster.length
                ),
            }).map(
              (_, index) => (
                <EmptyRosterCard
                  key={`empty-${index}`}
                  number={
                    visibleRoster.length +
                    index +
                    1
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">
              NO PLAYER DATA
            </p>

            <p className="mt-2 text-xs text-slate-700">
              Squad roster is currently empty.
            </p>
          </div>
        )}
      </div>

      {members.length > 0 && (
        <div className="border-t border-cyan-400/10 px-4 py-3">
          <Link
            href="/team/roster"
            className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 transition hover:text-cyan-400"
          >
            <span>
              OPEN FULL ROSTER
            </span>

            <span>→</span>
          </Link>
        </div>
      )}
    </section>
  );
}

function RosterCard({
  member,
  number,
}: {
  member: TeamMember;
  number: number;
}) {
  return (
    <div className="group relative overflow-hidden border border-cyan-400/10 bg-[#07121A] p-3 transition hover:border-cyan-400/30 hover:bg-[#091720]">
      <div className="flex items-center gap-3">
        <CharacterAvatar
          name={
            member.ign ||
            member.name
          }
          avatarUrl={
            member.avatarUrl
          }
          photoUrl={
            member.photoUrl
          }
          size="md"
          number={number}
          status="ONLINE"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-black uppercase text-white">
              {member.ign ||
                member.name}
            </h3>

            <span className="shrink-0 text-[7px] font-black uppercase text-emerald-400">
              READY
            </span>
          </div>

          <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-500">
            {member.competitiveRole
              ? formatRole(
                  member.competitiveRole
                )
              : "PLAYER"}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[7px] uppercase tracking-wider text-slate-600">
              ID
            </span>

            <span className="font-mono text-[8px] text-slate-400">
              {member.characterId ||
                "UNASSIGNED"}
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-cyan-400/[0.03] to-transparent" />
    </div>
  );
}

function EmptyRosterCard({
  number,
}: {
  number: number;
}) {
  return (
    <div className="relative flex min-h-[88px] items-center border border-dashed border-slate-800 bg-black/10 px-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center border border-slate-800 bg-slate-950 text-xs font-black text-slate-700">
          {String(number).padStart(
            2,
            "0"
          )}
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-700">
            WAITING FOR PLAYER
          </p>

          <p className="mt-1 text-[7px] uppercase tracking-wider text-slate-800">
            SLOT AVAILABLE
          </p>
        </div>
      </div>

      <span className="ml-auto text-[7px] font-black uppercase tracking-wider text-slate-700">
        CONNECTING
      </span>
    </div>
  );
}

/* =========================================================
   TEAM INTEL
========================================================= */

function TeamIntel({
  owner,
  manager,
  staff,
}: {
  owner: TeamMember | null;
  manager: TeamMember | null;
  staff: TeamMember[];
}) {
  return (
    <section className="relative overflow-hidden border border-cyan-400/10 bg-[#040B11]">
      <div className="border-b border-cyan-400/10 px-5 py-4">
        <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
          // TEAM INTEL
        </p>

        <h2 className="mt-1 text-lg font-black uppercase">
          Command Staff
        </h2>
      </div>

      <div className="grid gap-px bg-cyan-400/5 md:grid-cols-2">
        <LeadershipCard
          member={owner}
          role="OWNER"
        />

        <LeadershipCard
          member={manager}
          role="MANAGER"
        />
      </div>

      {staff.length > 0 && (
        <div className="border-t border-cyan-400/10 p-4">
          <p className="mb-3 text-[7px] font-black uppercase tracking-[0.25em] text-slate-600">
            SUPPORT STAFF
          </p>

          <div className="flex flex-wrap gap-2">
            {staff.map(
              (member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-2 py-2"
                >
                  <CharacterAvatar
                    name={
                      member.ign ||
                      member.name
                    }
                    avatarUrl={
                      member.avatarUrl
                    }
                    photoUrl={
                      member.photoUrl
                    }
                    size="xs"
                  />

                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-300">
                      {member.ign ||
                        member.name}
                    </p>

                    <p className="text-[6px] font-bold uppercase tracking-wider text-cyan-500">
                      {formatRole(
                        member.role
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LeadershipCard({
  member,
  role,
}: {
  member: TeamMember | null;
  role: "OWNER" | "MANAGER";
}) {
  if (!member) {
    return (
      <div className="bg-[#050C12] p-5">
        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-700">
          {role}
        </p>

        <p className="mt-3 text-xs font-bold uppercase text-slate-700">
          POSITION VACANT
        </p>
      </div>
    );
  }

  return (
    <div className="group relative bg-[#050C12] p-5 transition hover:bg-[#07121A]">
      <div className="flex items-center gap-4">
        <CharacterAvatar
          name={
            member.ign ||
            member.name
          }
          avatarUrl={
            member.avatarUrl
          }
          photoUrl={
            member.photoUrl
          }
          size="lg"
          status="ONLINE"
        />

        <div className="min-w-0">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-cyan-500">
            {role}
          </p>

          <h3 className="mt-1 truncate text-lg font-black uppercase">
            {member.ign ||
              member.name}
          </h3>

          {member.ign &&
            member.ign !==
              member.name && (
              <p className="mt-1 truncate text-[8px] text-slate-600">
                {member.name}
              </p>
            )}

          <div className="mt-3 flex items-center gap-2">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-400">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOURNAMENT OVERVIEW
========================================================= */

function TournamentOverview({
  upcoming,
  live,
  qualified,
  completed,
}: {
  upcoming: Tournament[];
  live: Tournament[];
  qualified: Tournament[];
  completed: Tournament[];
}) {
  return (
    <section className="border border-cyan-400/10 bg-[#040B11]">
      <div className="border-b border-cyan-400/10 px-5 py-4">
        <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
          // OPERATIONS LOG
        </p>

        <h2 className="mt-1 text-lg font-black uppercase">
          Tournament Status
        </h2>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-cyan-400/10 lg:grid-cols-4 lg:divide-y-0">
        <OperationStatus
          label="UPCOMING"
          value={
            upcoming.length
          }
          color="cyan"
        />

        <OperationStatus
          label="LIVE"
          value={live.length}
          color="green"
        />

        <OperationStatus
          label="QUALIFIED"
          value={
            qualified.length
          }
          color="purple"
        />

        <OperationStatus
          label="COMPLETED"
          value={
            completed.length
          }
          color="slate"
        />
      </div>
    </section>
  );
}

function OperationStatus({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color:
    | "cyan"
    | "green"
    | "purple"
    | "slate";
}) {
  const colors = {
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    purple: "text-purple-400",
    slate: "text-slate-400",
  };

  return (
    <div className="p-5">
      <p className="text-[7px] font-black uppercase tracking-[0.25em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${colors[color]}`}
      >
        {value}
      </p>

      <div className="mt-3 h-px bg-white/5">
        <div
          className={`h-px w-1/2 ${
            color === "cyan"
              ? "bg-cyan-400"
              : color === "green"
                ? "bg-emerald-400"
                : color === "purple"
                  ? "bg-purple-400"
                  : "bg-slate-500"
          }`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   INTEL PANELS
========================================================= */

function IntelPanel({
  label,
  value,
  description,
  type,
}: {
  label: string;
  value: string;
  description: string;
  type:
    | "normal"
    | "good"
    | "warning";
}) {
  const accent =
    type === "good"
      ? "text-emerald-400"
      : type === "warning"
        ? "text-amber-400"
        : "text-cyan-400";

  const dot =
    type === "good"
      ? "bg-emerald-400"
      : type === "warning"
        ? "bg-amber-400"
        : "bg-cyan-400";

  return (
    <div className="border border-cyan-400/5 bg-[#040B11] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-white/5 bg-white/[0.02]">
          <span
            className={`h-2 w-2 rounded-full ${dot} shadow-[0_0_10px_currentColor]`}
          />
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.25em] text-slate-600">
            {label}
          </p>

          <p
            className={`mt-1 text-sm font-black uppercase ${accent}`}
          >
            {value}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[8px] leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickAction({
  href,
  label,
  code,
  comingSoon = false,
}: {
  href: string;
  label: string;
  code: string;
  comingSoon?: boolean;
}) {
  if (comingSoon) {
    return (
      <div className="group relative p-4 opacity-50 sm:p-5">
        <span className="text-[7px] font-black text-slate-700">
          {code}
        </span>

        <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-slate-600">
          {label}
        </p>

        <p className="mt-2 text-[6px] uppercase tracking-wider text-slate-700">
          COMING SOON
        </p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative p-4 transition hover:bg-cyan-400/5 sm:p-5"
    >
      <span className="text-[7px] font-black text-slate-700 transition group-hover:text-cyan-500">
        {code}
      </span>

      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400 transition group-hover:text-cyan-300">
        {label}
      </p>

      <span className="mt-3 block text-[9px] text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-400">
        →
      </span>
    </Link>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SystemMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "good";
}) {
  return (
    <div className="border border-white/5 bg-black/20 px-3 py-2">
      <p className="text-[6px] font-black uppercase tracking-[0.2em] text-slate-700">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        {status && (
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
        )}

        <p
          className={`font-mono text-[9px] font-black ${
            status
              ? "text-emerald-400"
              : "text-cyan-400"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-white/5 bg-black/20 p-3">
      <p className="text-[6px] font-black uppercase tracking-[0.2em] text-slate-700">
        {label}
      </p>

      <p className="mt-1 truncate text-[9px] font-black uppercase text-slate-300">
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: TournamentStatus;
}) {
  const styles = {
    UPCOMING:
      "border-blue-400/20 bg-blue-400/5 text-blue-400",

    LIVE:
      "border-emerald-400/20 bg-emerald-400/5 text-emerald-400",

    QUALIFIED:
      "border-purple-400/20 bg-purple-400/5 text-purple-400",

    COMPLETED:
      "border-slate-400/10 bg-slate-400/5 text-slate-400",

    CANCELLED:
      "border-red-400/20 bg-red-400/5 text-red-400",
  };

  return (
    <span
      className={`border px-2 py-1 text-[7px] font-black uppercase tracking-[0.2em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function HudCorners() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 z-20 h-3 w-3 border-l border-t border-cyan-300/60" />

      <span className="pointer-events-none absolute right-0 top-0 z-20 h-3 w-3 border-r border-t border-cyan-300/60" />

      <span className="pointer-events-none absolute bottom-0 left-0 z-20 h-3 w-3 border-b border-l border-cyan-300/60" />

      <span className="pointer-events-none absolute bottom-0 right-0 z-20 h-3 w-3 border-b border-r border-cyan-300/60" />
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getPrimaryRole(
  roles: string[]
) {
  if (roles.includes("OWNER"))
    return "OWNER";

  if (roles.includes("MANAGER"))
    return "MANAGER";

  if (roles.includes("COACH"))
    return "COACH";

  if (roles.includes("ANALYST"))
    return "ANALYST";

  if (roles.includes("PLAYER"))
    return "PLAYER";

  return "OPERATOR";
}

function formatRole(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatTime(
  timestamp: number
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  ).format(
    new Date(timestamp)
  );
}

function formatShortDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getCountdown(
  value: string
) {
  const target =
    new Date(value).getTime();

  const difference =
    target - Date.now();

  if (difference <= 0) {
    return "00:00:00";
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const days =
    Math.floor(
      totalSeconds / 86400
    );

  const hours =
    Math.floor(
      (totalSeconds % 86400) /
        3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${String(days).padStart(2, "0")}D ${String(hours).padStart(2, "0")}H`;
  }

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((part) =>
      String(part).padStart(
        2,
        "0"
      )
    )
    .join(":");
}

function getLiveDuration(
  value: string
) {
  const start =
    new Date(value).getTime();

  const difference =
    Date.now() - start;

  if (difference <= 0) {
    return "00:00:00";
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((part) =>
      String(part).padStart(
        2,
        "0"
      )
    )
    .join(":");
}

function getTournamentDescription(
  tournament: Tournament
) {
  if (
    tournament.status ===
    "QUALIFIED"
  ) {
    const rounds =
      Array.isArray(
        tournament.rounds
      )
        ? tournament.rounds
        : [];

    if (rounds.length > 0) {
      const latest =
        rounds[
          rounds.length - 1
        ];

      return `Qualified for ${latest.name}. Next round scheduled for ${formatShortDate(
        latest.startAt
      )}.`;
    }

    return "Team qualified for the next round.";
  }

  if (
    tournament.status ===
    "LIVE"
  ) {
    return "Tournament is currently active.";
  }

  if (
    tournament.status ===
    "COMPLETED"
  ) {
    return "Tournament has been completed.";
  }

  return "Tournament scheduled for team operations.";
}

function getRoundLabel(
  tournament: Tournament
) {
  const rounds =
    Array.isArray(
      tournament.rounds
    )
      ? tournament.rounds
      : [];

  if (rounds.length === 0) {
    return "ROUND 01";
  }

  const latest =
    rounds[
      rounds.length - 1
    ];

  return `ROUND ${String(
    latest.roundNumber
  ).padStart(2, "0")}`;
}