"use client";

import { useEffect, useState } from "react";

import TeamSidebar from "@/components/team-sidebar";

type TournamentStatus =
  | "UPCOMING"
  | "LIVE"
  | "QUALIFIED"
  | "COMPLETED"
  | "CANCELLED";

type TournamentRound = {
  id: string;
  name: string;
  roundNumber: number;
  startAt: string;
  endAt: string | null;
};

type Tournament = {
  id: string;
  name: string;
  organizer: string | null;
  description: string | null;
  status: TournamentStatus;
  startAt: string;
  endAt: string | null;
  slotNumber: string | null;
  pointSystem: string | null;
  finalPosition: number | null;
  totalPoints: number | null;
  rounds?: TournamentRound[];
};

export default function Home() {
  const [tournaments, setTournaments] =
    useState<Tournament[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadTournaments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/tournaments",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      if (!text) {
        throw new Error(
          "Empty response from tournament API."
        );
      }

      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load tournaments."
        );
      }

      const data = Array.isArray(
        result.tournaments
      )
        ? result.tournaments
        : [];

      setTournaments(data);
    } catch (err) {
      console.error(
        "Dashboard tournament error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tournaments."
      );

      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTournaments();

    const interval =
      window.setInterval(
        loadTournaments,
        60_000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  const upcoming =
    tournaments.filter(
      (tournament) =>
        tournament.status ===
        "UPCOMING"
    );

  const live =
    tournaments.filter(
      (tournament) =>
        tournament.status ===
        "LIVE"
    );

  const qualified =
    tournaments.filter(
      (tournament) =>
        tournament.status ===
        "QUALIFIED"
    );

  const completed =
    tournaments.filter(
      (tournament) =>
        tournament.status ===
        "COMPLETED"
    );

  return (
    <main className="min-h-screen bg-[#080a0c] text-white">
      <TeamSidebar />

      <div className="ml-[260px] min-h-screen">
        {/* HEADER */}

        <header className="border-b border-white/10 px-8 py-7">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-400">
            VER ESPORTS
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Dashboard
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Team overview and tournament
                progress.
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadTournaments
              }
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm font-bold text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* STATS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Upcoming"
              value={
                upcoming.length
              }
              icon="📅"
            />

            <StatCard
              label="Live"
              value={
                live.length
              }
              icon="🔴"
            />

            <StatCard
              label="Qualified"
              value={
                qualified.length
              }
              icon="🟣"
            />

            <StatCard
              label="Completed"
              value={
                completed.length
              }
              icon="🏆"
            />
          </div>

          {/* DEBUG / DATA CONFIRMATION */}

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
                  COMPETITION
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Tournaments
                </h2>
              </div>

              <p className="text-xs font-bold text-white/25">
                {tournaments.length}{" "}
                total
              </p>
            </div>

            {loading ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-sm font-bold text-white/30">
                  Loading tournaments...
                </p>
              </div>
            ) : tournaments.length ===
              0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
                <div className="text-3xl">
                  🏆
                </div>

                <p className="mt-4 text-lg font-black">
                  No tournaments
                </p>

                <p className="mt-2 text-sm text-white/30">
                  Your tournament
                  activity will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {tournaments.map(
                  (tournament) => (
                    <DashboardTournamentCard
                      key={
                        tournament.id
                      }
                      tournament={
                        tournament
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>

          {/* RECENT RESULTS */}

          <section className="mt-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
                HISTORY
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Recent Results
              </h2>
            </div>

            {completed.length ===
            0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-sm font-bold text-white/30">
                  No completed tournaments
                  yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                {completed.map(
                  (
                    tournament,
                    index
                  ) => (
                    <div
                      key={
                        tournament.id
                      }
                      className={`flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between ${
                        index > 0
                          ? "border-t border-white/10"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-black">
                          {
                            tournament.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {formatDate(
                            tournament.startAt
                          )}
                        </p>
                      </div>

                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25">
                            Position
                          </p>

                          <p className="mt-1 font-black text-green-400">
                            {tournament.finalPosition
                              ? `#${tournament.finalPosition}`
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25">
                            Points
                          </p>

                          <p className="mt-1 font-black">
                            {tournament.totalPoints ??
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ================================================== */
/* DASHBOARD TOURNAMENT CARD */
/* ================================================== */

function DashboardTournamentCard({
  tournament,
}: {
  tournament: Tournament;
}) {
  const rounds =
    Array.isArray(
      tournament.rounds
    )
      ? tournament.rounds
      : [];

  const latestRound =
    rounds.length > 0
      ? rounds[
          rounds.length - 1
        ]
      : null;

  /*
   * For QUALIFIED / UPCOMING,
   * display the latest round.
   */
  const useRound =
    tournament.status ===
      "QUALIFIED" ||
    tournament.status ===
      "UPCOMING";

  const displayName =
    useRound &&
    latestRound
      ? latestRound.name
      : tournament.name;

  const displayStart =
    useRound &&
    latestRound
      ? latestRound.startAt
      : tournament.startAt;

  const displayEnd =
    useRound &&
    latestRound
      ? latestRound.endAt
      : tournament.endAt;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/15">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <StatusBadge
            status={
              tournament.status
            }
          />

          <h3 className="mt-4 truncate text-2xl font-black">
            {displayName}
          </h3>

          {tournament.organizer && (
            <p className="mt-1 text-sm text-white/35">
              Organized by{" "}
              {
                tournament.organizer
              }
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-400/10 text-xl">
          🏆
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <InfoItem
          label="START"
          value={formatDate(
            displayStart
          )}
        />

        <InfoItem
          label="END"
          value={
            displayEnd
              ? formatDate(
                  displayEnd
                )
              : "—"
          }
        />
      </div>

      {tournament.status ===
        "QUALIFIED" &&
        latestRound && (
          <div className="mt-4 rounded-2xl border border-purple-400/15 bg-purple-400/[0.05] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300/70">
              NEXT ROUND
            </p>

            <p className="mt-1 text-lg font-black text-purple-300">
              {latestRound.name}
            </p>

            <p className="mt-1 text-xs text-white/30">
              {formatDate(
                latestRound.startAt
              )}
            </p>
          </div>
        )}

      {tournament.status ===
        "COMPLETED" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoItem
            label="POSITION"
            value={
              tournament.finalPosition
                ? `#${tournament.finalPosition}`
                : "—"
            }
          />

          <InfoItem
            label="POINTS"
            value={
              tournament.totalPoints !==
              null
                ? tournament.totalPoints.toString()
                : "—"
            }
          />
        </div>
      )}
    </div>
  );
}

/* ================================================== */
/* STAT CARD */
/* ================================================== */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
          {label}
        </p>

        <span className="text-lg">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

/* ================================================== */
/* INFO ITEM */
/* ================================================== */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-white/70">
        {value}
      </p>
    </div>
  );
}

/* ================================================== */
/* STATUS */
/* ================================================== */

function StatusBadge({
  status,
}: {
  status: TournamentStatus;
}) {
  const styles = {
    UPCOMING:
      "bg-blue-400/10 text-blue-300",
    LIVE:
      "bg-green-400/10 text-green-400",
    QUALIFIED:
      "bg-purple-400/10 text-purple-300",
    COMPLETED:
      "bg-white/10 text-white/50",
    CANCELLED:
      "bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ================================================== */
/* DATE */
/* ================================================== */

function formatDate(
  value: string
) {
  const date = new Date(value);

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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}