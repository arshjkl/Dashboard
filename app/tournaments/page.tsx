"use client";

import { useEffect, useMemo, useState } from "react";

import TeamSidebar from "@/components/team-sidebar";

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

type SessionResponse = {
  authenticated: boolean;
  roles?: string[];
  error?: string;
};

type Filter =
  | "UPCOMING"
  | "LIVE"
  | "QUALIFIED"
  | "COMPLETED";

type TournamentForm = {
  name: string;
  organizer: string;
  description: string;
  startAt: string;
  endAt: string;
  slotNumber: string;
  pointSystem: string;
  roomId: string;
  roomPassword: string;
};

type CompleteForm = {
  finalPosition: string;
  totalPoints: string;
};

type QualifyForm = {
  roundName: string;
  startAt: string;
  endAt: string;
  slotNumber: string;
  pointSystem: string;
  roomId: string;
  roomPassword: string;
};

const emptyTournamentForm: TournamentForm = {
  name: "",
  organizer: "",
  description: "",
  startAt: "",
  endAt: "",
  slotNumber: "",
  pointSystem: "",
  roomId: "",
  roomPassword: "",
};

const emptyCompleteForm: CompleteForm = {
  finalPosition: "",
  totalPoints: "",
};

const emptyQualifyForm: QualifyForm = {
  roundName: "",
  startAt: "",
  endAt: "",
  slotNumber: "",
  pointSystem: "",
  roomId: "",
  roomPassword: "",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] =
    useState<Tournament[]>([]);

  const [roles, setRoles] =
    useState<string[]>([]);

  const [filter, setFilter] =
    useState<Filter>("UPCOMING");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [
    showCompleteModal,
    setShowCompleteModal,
  ] = useState(false);

  const [
    showQualifyModal,
    setShowQualifyModal,
  ] = useState(false);

  const [
    selectedTournament,
    setSelectedTournament,
  ] = useState<Tournament | null>(
    null
  );

  const [creating, setCreating] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [
    tournamentForm,
    setTournamentForm,
  ] = useState<TournamentForm>(
    emptyTournamentForm
  );

  const [
    completeForm,
    setCompleteForm,
  ] = useState<CompleteForm>(
    emptyCompleteForm
  );

  const [
    qualifyForm,
    setQualifyForm,
  ] = useState<QualifyForm>(
    emptyQualifyForm
  );

  async function loadTournaments() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/tournaments",
        {
          cache: "no-store",
        }
      );

      const result: TournamentResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load tournaments."
        );
      }

      setTournaments(
        Array.isArray(result.tournaments)
          ? result.tournaments
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load tournaments."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSession() {
    try {
      const response = await fetch(
        "/api/me",
        {
          cache: "no-store",
        }
      );

      const result: SessionResponse =
        await response.json();

      if (
        response.ok &&
        result.authenticated
      ) {
        setRoles(result.roles || []);
      } else {
        setRoles([]);
      }
    } catch {
      setRoles([]);
    }
  }

  useEffect(() => {
    loadTournaments();
    loadSession();
  }, []);

  const canManage =
    roles.includes("OWNER") ||
    roles.includes("MANAGER");

  const filteredTournaments =
    useMemo(() => {
      return tournaments.filter(
        (tournament) =>
          tournament.status === filter
      );
    }, [tournaments, filter]);

  const counts = {
    upcoming: tournaments.filter(
      (tournament) =>
        tournament.status === "UPCOMING"
    ).length,

    live: tournaments.filter(
      (tournament) =>
        tournament.status === "LIVE"
    ).length,

    qualified: tournaments.filter(
      (tournament) =>
        tournament.status === "QUALIFIED"
    ).length,

    completed: tournaments.filter(
      (tournament) =>
        tournament.status === "COMPLETED"
    ).length,
  };

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function openCreateModal() {
    clearMessages();

    setTournamentForm({
      ...emptyTournamentForm,
    });

    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (creating) return;

    setShowCreateModal(false);
  }

  function openEditModal(
    tournament: Tournament
  ) {
    clearMessages();

    setSelectedTournament(
      tournament
    );

    setTournamentForm({
      name: tournament.name,
      organizer:
        tournament.organizer || "",
      description:
        tournament.description || "",
      startAt: toDateTimeLocal(
        tournament.startAt
      ),
      endAt: tournament.endAt
        ? toDateTimeLocal(
            tournament.endAt
          )
        : "",
      slotNumber:
        tournament.slotNumber || "",
      pointSystem:
        tournament.pointSystem || "",
      roomId:
        tournament.roomId || "",
      roomPassword:
        tournament.roomPassword || "",
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    if (updating) return;

    setShowEditModal(false);
    setSelectedTournament(null);
  }

  function openCompleteModal(
    tournament: Tournament
  ) {
    clearMessages();

    setSelectedTournament(
      tournament
    );

    setCompleteForm({
      finalPosition:
        tournament.finalPosition?.toString() ||
        "",
      totalPoints:
        tournament.totalPoints?.toString() ||
        "",
    });

    setShowCompleteModal(true);
  }

  function closeCompleteModal() {
    if (updating) return;

    setShowCompleteModal(false);
    setSelectedTournament(null);
  }

  function openQualifyModal(
    tournament: Tournament
  ) {
    clearMessages();

    setSelectedTournament(
      tournament
    );

    const rounds = Array.isArray(
      tournament.rounds
    )
      ? tournament.rounds
      : [];

    const nextRoundNumber =
      rounds.length + 1;

    setQualifyForm({
      roundName: `Round ${nextRoundNumber}`,
      startAt: "",
      endAt: "",
      slotNumber:
        tournament.slotNumber || "",
      pointSystem:
        tournament.pointSystem || "",
      roomId: "",
      roomPassword: "",
    });

    setShowQualifyModal(true);
  }

  function closeQualifyModal() {
    if (updating) return;

    setShowQualifyModal(false);
    setSelectedTournament(null);
  }

  async function createTournament() {
    clearMessages();

    if (!tournamentForm.name.trim()) {
      setError(
        "Tournament name is required."
      );
      return;
    }

    if (!tournamentForm.startAt) {
      setError(
        "Start date and time are required."
      );
      return;
    }

    if (
      tournamentForm.endAt &&
      new Date(
        tournamentForm.endAt
      ) <
        new Date(
          tournamentForm.startAt
        )
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        "/api/tournaments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name:
              tournamentForm.name.trim(),
            organizer:
              tournamentForm.organizer.trim() ||
              null,
            description:
              tournamentForm.description.trim() ||
              null,
            startAt:
              tournamentForm.startAt,
            endAt:
              tournamentForm.endAt ||
              null,
            slotNumber:
              tournamentForm.slotNumber.trim() ||
              null,
            pointSystem:
              tournamentForm.pointSystem.trim() ||
              null,
            roomId:
              tournamentForm.roomId.trim() ||
              null,
            roomPassword:
              tournamentForm.roomPassword.trim() ||
              null,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create tournament."
        );
      }

      setShowCreateModal(false);
      setFilter("UPCOMING");

      setSuccess(
        "Tournament created successfully."
      );

      await loadTournaments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create tournament."
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateTournament(
    action: string,
    payload: Record<string, unknown> = {}
  ) {
    if (!selectedTournament) {
      return;
    }

    clearMessages();
    setUpdating(true);

    try {
      const response = await fetch(
        `/api/tournaments/${selectedTournament.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            ...payload,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update tournament."
        );
      }

      await loadTournaments();

      if (action === "edit") {
        setShowEditModal(false);

        setSuccess(
          "Tournament updated successfully."
        );
      }

      if (action === "complete") {
        setShowCompleteModal(false);
        setFilter("COMPLETED");

        setSuccess(
          "Tournament marked as completed."
        );
      }

      if (action === "qualify") {
        setShowQualifyModal(false);
        setFilter("QUALIFIED");

        setSuccess(
          "Team qualified for the next round."
        );
      }

      setSelectedTournament(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update tournament."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function markLive(
    tournament: Tournament
  ) {
    clearMessages();

    setUpdating(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "live",
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to mark tournament as live."
        );
      }

      await loadTournaments();

      setFilter("LIVE");

      setSuccess(
        "Tournament is now live."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update tournament."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function deleteTournament(
    tournament: Tournament
  ) {
    const confirmed =
      window.confirm(
        `Delete "${tournament.name}" permanently?\n\nThis will remove the completed tournament and all of its rounds.`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setUpdating(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete tournament."
        );
      }

      await loadTournaments();

      setFilter("COMPLETED");

      setSuccess(
        "Tournament deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete tournament."
      );
    } finally {
      setUpdating(false);
    }
  }

  function updateTournamentForm(
    field: keyof TournamentForm,
    value: string
  ) {
    setTournamentForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateCompleteForm(
    field: keyof CompleteForm,
    value: string
  ) {
    setCompleteForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateQualifyForm(
    field: keyof QualifyForm,
    value: string
  ) {
    setQualifyForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function submitEdit() {
    if (!selectedTournament) {
      return;
    }

    if (!tournamentForm.name.trim()) {
      setError(
        "Tournament name is required."
      );
      return;
    }

    if (!tournamentForm.startAt) {
      setError(
        "Start date and time are required."
      );
      return;
    }

    if (
      tournamentForm.endAt &&
      new Date(
        tournamentForm.endAt
      ) <
        new Date(
          tournamentForm.startAt
        )
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
    }

    updateTournament("edit", {
      name:
        tournamentForm.name.trim(),
      organizer:
        tournamentForm.organizer.trim() ||
        null,
      description:
        tournamentForm.description.trim() ||
        null,
      startAt:
        tournamentForm.startAt,
      endAt:
        tournamentForm.endAt || "",
      slotNumber:
        tournamentForm.slotNumber.trim() ||
        null,
      pointSystem:
        tournamentForm.pointSystem.trim() ||
        null,
      roomId:
        tournamentForm.roomId.trim() ||
        null,
      roomPassword:
        tournamentForm.roomPassword.trim() ||
        null,
    });
  }

  function submitComplete() {
    if (!selectedTournament) {
      return;
    }

    const position = Number(
      completeForm.finalPosition
    );

    const points = Number(
      completeForm.totalPoints
    );

    if (
      !Number.isInteger(position) ||
      position < 1
    ) {
      setError(
        "Final position must be a positive number."
      );
      return;
    }

    if (
      !Number.isFinite(points) ||
      points < 0
    ) {
      setError(
        "Total points must be zero or greater."
      );
      return;
    }

    updateTournament("complete", {
      finalPosition: position,
      totalPoints: points,
    });
  }

  function submitQualify() {
    if (!selectedTournament) {
      return;
    }

    if (
      !qualifyForm.roundName.trim()
    ) {
      setError(
        "Next round name is required."
      );
      return;
    }

    if (!qualifyForm.startAt) {
      setError(
        "Next round start date and time are required."
      );
      return;
    }

    if (
      qualifyForm.endAt &&
      new Date(
        qualifyForm.endAt
      ) <
        new Date(
          qualifyForm.startAt
        )
    ) {
      setError(
        "Next round end date cannot be before its start date."
      );
      return;
    }

    updateTournament("qualify", {
      roundName:
        qualifyForm.roundName.trim(),
      startAt:
        qualifyForm.startAt,
      endAt:
        qualifyForm.endAt || null,
      slotNumber:
        qualifyForm.slotNumber.trim() ||
        null,
      pointSystem:
        qualifyForm.pointSystem.trim() ||
        null,
      roomId:
        qualifyForm.roomId.trim() ||
        null,
      roomPassword:
        qualifyForm.roomPassword.trim() ||
        null,
    });
  }

  return (
    <main className="min-h-screen bg-[#050708] text-white selection:bg-green-400/30">
      <TeamSidebar />

      <div className="relative min-h-screen overflow-hidden md:ml-[260px]">
        <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_80%_0%,rgba(74,222,128,0.07),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(34,211,238,0.035),transparent_25%)]" />
        <header className="relative border-b border-white/10 bg-[#080c0d]/90 px-4 py-6 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-green-400">
                COMPETITION
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight">
                Tournaments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                Manage your team's competition
                journey from the first round to
                qualification or elimination.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="rounded-xl border border-green-400/25 bg-green-400/10 px-5 py-3 text-sm font-black text-green-400 transition hover:border-green-400/50 hover:bg-green-400/15 hover:text-green-300"
              >
                + Create Tournament
              </button>
            )}
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8"><div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.07),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.04),transparent_28%)]" />
          {error && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-300">
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm font-bold text-green-300">
              <span>{success}</span>

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Upcoming"
              value={
                counts.upcoming
              }
              active={
                filter === "UPCOMING"
              }
              onClick={() =>
                setFilter("UPCOMING")
              }
            />

            <SummaryCard
              label="Live"
              value={counts.live}
              active={
                filter === "LIVE"
              }
              onClick={() =>
                setFilter("LIVE")
              }
            />

            <SummaryCard
              label="Qualified"
              value={
                counts.qualified
              }
              active={
                filter === "QUALIFIED"
              }
              onClick={() =>
                setFilter("QUALIFIED")
              }
            />

            <SummaryCard
              label="Completed"
              value={
                counts.completed
              }
              active={
                filter === "COMPLETED"
              }
              onClick={() =>
                setFilter("COMPLETED")
              }
            />
          </div>

          <div className="mt-8 flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
            <FilterButton
              label="Upcoming"
              active={
                filter === "UPCOMING"
              }
              onClick={() =>
                setFilter("UPCOMING")
              }
            />

            <FilterButton
              label="Live"
              active={
                filter === "LIVE"
              }
              onClick={() =>
                setFilter("LIVE")
              }
            />

            <FilterButton
              label="Qualified"
              active={
                filter === "QUALIFIED"
              }
              onClick={() =>
                setFilter("QUALIFIED")
              }
            />

            <FilterButton
              label="Completed"
              active={
                filter === "COMPLETED"
              }
              onClick={() =>
                setFilter("COMPLETED")
              }
            />
          </div>

          <section className="mt-6">
            {loading ? (
              <LoadingState />
            ) : filteredTournaments.length ===
              0 ? (
              <EmptyState
                filter={filter}
              />
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredTournaments.map(
                  (tournament) => (
                    <TournamentCard
                      key={
                        tournament.id
                      }
                      tournament={
                        tournament
                      }
                      canManage={
                        canManage
                      }
                      updating={
                        updating
                      }
                      onEdit={() =>
                        openEditModal(
                          tournament
                        )
                      }
                      onLive={() =>
                        markLive(
                          tournament
                        )
                      }
                      onComplete={() =>
                        openCompleteModal(
                          tournament
                        )
                      }
                      onQualify={() =>
                        openQualifyModal(
                          tournament
                        )
                      }
                      onDelete={
                        deleteTournament
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {showCreateModal &&
        canManage && (
          <TournamentFormModal
            title="Create Tournament"
            submitLabel={
              creating
                ? "Creating..."
                : "Create Tournament"
            }
            form={
              tournamentForm
            }
            loading={creating}
            onChange={
              updateTournamentForm
            }
            onClose={
              closeCreateModal
            }
            onSubmit={
              createTournament
            }
          />
        )}

      {showEditModal &&
        canManage &&
        selectedTournament && (
          <TournamentFormModal
            title="Edit Tournament"
            submitLabel={
              updating
                ? "Saving..."
                : "Save Changes"
            }
            form={
              tournamentForm
            }
            loading={updating}
            onChange={
              updateTournamentForm
            }
            onClose={
              closeEditModal
            }
            onSubmit={
              submitEdit
            }
          />
        )}

      {showCompleteModal &&
        canManage &&
        selectedTournament && (
          <CompleteModal
            tournament={
              selectedTournament
            }
            form={completeForm}
            loading={updating}
            onChange={
              updateCompleteForm
            }
            onClose={
              closeCompleteModal
            }
            onSubmit={
              submitComplete
            }
          />
        )}

      {showQualifyModal &&
        canManage &&
        selectedTournament && (
          <QualifyModal
            tournament={
              selectedTournament
            }
            form={qualifyForm}
            loading={updating}
            onChange={
              updateQualifyForm
            }
            onClose={
              closeQualifyModal
            }
            onSubmit={
              submitQualify
            }
          />
        )}
    </main>
  );
}

/* ================================================== */
/* TOURNAMENT CARD */
/* ================================================== */

function TournamentCard({
  tournament,
  canManage,
  updating,
  onEdit,
  onLive,
  onComplete,
  onQualify,
  onDelete,
}: {
  tournament: Tournament;
  canManage: boolean;
  updating: boolean;
  onEdit: () => void;
  onLive: () => void;
  onComplete: () => void;
  onQualify: () => void;
  onDelete: (
    tournament: Tournament
  ) => void;
}) {
  const rounds = Array.isArray(
    tournament.rounds
  )
    ? tournament.rounds
    : [];

  const latestRound =
    rounds.length > 0
      ? rounds[rounds.length - 1]
      : null;

  const displayRound =
    latestRound &&
    (tournament.status ===
      "QUALIFIED" ||
      tournament.status ===
        "UPCOMING")
      ? latestRound
      : null;

  const displayName =
    displayRound?.name ||
    tournament.name;

  const displayStart =
    displayRound?.startAt ||
    tournament.startAt;

  const displayEnd =
    displayRound?.endAt ??
    tournament.endAt;

  const displaySlots =
    displayRound?.slotNumber ??
    tournament.slotNumber;

  const displayPointSystem =
    displayRound?.pointSystem ??
    tournament.pointSystem;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-green-400/[0.055] via-white/[0.025] to-transparent p-6 shadow-2xl transition hover:border-green-400/20">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <StatusBadge
            status={
              tournament.status
            }
          />

          <h2 className="mt-4 truncate text-2xl font-black">
            {displayName}
          </h2>

          {tournament.organizer && (
            <p className="mt-1 text-sm text-white/40">
              Organized by{" "}
              <span className="font-bold text-white/60">
                {tournament.organizer}
              </span>
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-400/15 bg-green-400/10 text-lg text-green-400">
          🏆
        </div>
      </div>

      {tournament.description && (
        <p className="mt-5 line-clamp-2 text-sm leading-6 text-white/40">
          {tournament.description}
        </p>
      )}

      {tournament.status ===
      "COMPLETED" ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ResultItem
            label="FINAL POSITION"
            value={
              tournament.finalPosition
                ? `#${tournament.finalPosition}`
                : "—"
            }
          />

          <ResultItem
            label="TOTAL POINTS"
            value={
              tournament.totalPoints !==
              null
                ? tournament.totalPoints.toString()
                : "—"
            }
          />
        </div>
      ) : (
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

          <InfoItem
            label="SLOT"
            value={
              displaySlots || "—"
            }
          />

          <InfoItem
            label="POINT SYSTEM"
            value={
              displayPointSystem ||
              "—"
            }
          />
        </div>
      )}

      {tournament.status ===
        "QUALIFIED" &&
        latestRound && (
          <div className="mt-5 rounded-2xl border border-green-400/15 bg-green-400/[0.05] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-400/70">
              NEXT ROUND
            </p>

            <p className="mt-1 text-lg font-black text-green-400">
              {latestRound.name}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {formatDate(
                latestRound.startAt
              )}
            </p>
          </div>
        )}

      {canManage &&
        tournament.status !==
          "COMPLETED" && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={onEdit}
                disabled={updating}
                className="rounded-xl bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
              >
                Edit
              </button>

              {tournament.status ===
                "UPCOMING" && (
                <button
                  type="button"
                  onClick={onLive}
                  disabled={updating}
                  className="rounded-xl bg-cyan-400/10 px-4 py-2.5 text-xs font-black text-cyan-300 transition hover:bg-blue-400/20 disabled:opacity-30"
                >
                  Mark Live
                </button>
              )}

              {tournament.status ===
                "LIVE" && (
                <>
                  <button
                    type="button"
                    onClick={
                      onQualify
                    }
                    disabled={
                      updating
                    }
                    className="rounded-xl bg-green-400/10 px-4 py-2.5 text-xs font-black text-green-400 transition hover:bg-green-400/20 disabled:opacity-30"
                  >
                    Qualified
                  </button>

                  <button
                    type="button"
                    onClick={
                      onComplete
                    }
                    disabled={
                      updating
                    }
                    className="rounded-xl bg-red-400/10 px-4 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-400/20 disabled:opacity-30"
                  >
                    Completed
                  </button>
                </>
              )}

              {tournament.status ===
                "QUALIFIED" && (
                <button
                  type="button"
                  onClick={
                    onComplete
                  }
                  disabled={updating}
                  className="rounded-xl bg-red-400/10 px-4 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-400/20 disabled:opacity-30"
                >
                  Completed
                </button>
              )}
            </div>
          </div>
        )}

      {tournament.status ===
        "COMPLETED" && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-white/25">
                Tournament Result
              </p>

              <p className="mt-2 text-sm font-bold text-red-300">
                Eliminated from tournament
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() =>
                  onDelete(tournament)
                }
                disabled={updating}
                className="rounded-xl bg-red-400/10 px-4 py-2.5 text-xs font-black text-red-300 transition hover:bg-red-400/20 disabled:opacity-30"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================== */
/* TOURNAMENT FORM */
/* ================================================== */

function TournamentFormModal({
  title,
  submitLabel,
  form,
  loading,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  form: TournamentForm;
  loading: boolean;
  onChange: (
    field: keyof TournamentForm,
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <ModalShell
      title={title}
      subtitle="Manage tournament information."
      loading={loading}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Tournament Name"
            value={form.name}
            required
            placeholder="PMWC Qualifier"
            onChange={(value) =>
              onChange(
                "name",
                value
              )
            }
          />

          <Field
            label="Organizer"
            value={form.organizer}
            placeholder="KRAFTON"
            onChange={(value) =>
              onChange(
                "organizer",
                value
              )
            }
          />
        </div>

        <Field
          label="Description"
          value={form.description}
          textarea
          placeholder="Tournament overview..."
          onChange={(value) =>
            onChange(
              "description",
              value
            )
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Start Date & Time"
            value={form.startAt}
            type="datetime-local"
            required
            onChange={(value) =>
              onChange(
                "startAt",
                value
              )
            }
          />

          <Field
            label="End Date & Time"
            value={form.endAt}
            type="datetime-local"
            onChange={(value) =>
              onChange(
                "endAt",
                value
              )
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Slot Number"
            value={form.slotNumber}
            placeholder="16"
            onChange={(value) =>
              onChange(
                "slotNumber",
                value
              )
            }
          />

          <Field
            label="Point System"
            value={form.pointSystem}
            placeholder="Official BGMI"
            onChange={(value) =>
              onChange(
                "pointSystem",
                value
              )
            }
          />
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
            ROOM DETAILS
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Room ID"
            value={form.roomId}
            placeholder="12345678"
            onChange={(value) =>
              onChange(
                "roomId",
                value
              )
            }
          />

          <Field
            label="Room Password"
            value={
              form.roomPassword
            }
            type="password"
            placeholder="Room password"
            onChange={(value) =>
              onChange(
                "roomPassword",
                value
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-green-400 px-5 py-3.5 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}

/* ================================================== */
/* COMPLETE MODAL */
/* ================================================== */

function CompleteModal({
  tournament,
  form,
  loading,
  onChange,
  onClose,
  onSubmit,
}: {
  tournament: Tournament;
  form: CompleteForm;
  loading: boolean;
  onChange: (
    field: keyof CompleteForm,
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <ModalShell
      title="Complete Tournament"
      subtitle={`Record the final result for ${tournament.name}.`}
      loading={loading}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-4">
          <p className="text-sm font-bold text-red-300">
            Marking this tournament as
            completed means the team is out of
            the tournament.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Final Position"
            value={
              form.finalPosition
            }
            type="number"
            placeholder="7"
            required
            onChange={(value) =>
              onChange(
                "finalPosition",
                value
              )
            }
          />

          <Field
            label="Total Points"
            value={
              form.totalPoints
            }
            type="number"
            placeholder="86"
            required
            onChange={(value) =>
              onChange(
                "totalPoints",
                value
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-red-400 px-5 py-3.5 font-black text-black transition hover:bg-red-300 disabled:opacity-40"
        >
          {loading
            ? "Saving Result..."
            : "Mark Completed"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ================================================== */
/* QUALIFY MODAL */
/* ================================================== */

function QualifyModal({
  tournament,
  form,
  loading,
  onChange,
  onClose,
  onSubmit,
}: {
  tournament: Tournament;
  form: QualifyForm;
  loading: boolean;
  onChange: (
    field: keyof QualifyForm,
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <ModalShell
      title="Qualify for Next Round"
      subtitle={`Set up the next round for ${tournament.name}.`}
      loading={loading}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-green-400/10 bg-green-400/[0.04] p-4">
          <p className="text-sm font-bold text-green-300">
            VER ESPORTS will advance to the
            next round.
          </p>
        </div>

        <Field
          label="Next Round Name"
          value={form.roundName}
          required
          placeholder="Semi Finals"
          onChange={(value) =>
            onChange(
              "roundName",
              value
            )
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Start Date & Time"
            value={form.startAt}
            type="datetime-local"
            required
            onChange={(value) =>
              onChange(
                "startAt",
                value
              )
            }
          />

          <Field
            label="End Date & Time"
            value={form.endAt}
            type="datetime-local"
            onChange={(value) =>
              onChange(
                "endAt",
                value
              )
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Slots"
            value={form.slotNumber}
            placeholder="16"
            onChange={(value) =>
              onChange(
                "slotNumber",
                value
              )
            }
          />

          <Field
            label="Point System"
            value={form.pointSystem}
            placeholder="Official BGMI"
            onChange={(value) =>
              onChange(
                "pointSystem",
                value
              )
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Room ID"
            value={form.roomId}
            placeholder="12345678"
            onChange={(value) =>
              onChange(
                "roomId",
                value
              )
            }
          />

          <Field
            label="Room Password"
            value={
              form.roomPassword
            }
            type="password"
            placeholder="Room password"
            onChange={(value) =>
              onChange(
                "roomPassword",
                value
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-green-400 px-5 py-3.5 font-black text-black transition hover:bg-green-300 disabled:opacity-40"
        >
          {loading
            ? "Setting Up Next Round..."
            : "Continue to Next Round"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ================================================== */
/* MODAL SHELL */
/* ================================================== */

function ModalShell({
  title,
  subtitle,
  loading,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-5">
      <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0f0e] p-7 shadow-2xl">
        <div className="mb-7 flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">
              COMPETITION
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
            disabled={loading}
            className="rounded-xl px-3 py-2 text-white/30 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ================================================== */
/* SUMMARY */
/* ================================================== */

function SummaryCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-green-400/30 bg-green-400/[0.07]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          active
            ? "text-green-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </button>
  );
}

/* ================================================== */
/* FILTER */
/* ================================================== */

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
        active
          ? "bg-green-400 text-black"
          : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

/* ================================================== */
/* FIELD */
/* ================================================== */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}

        {required && (
          <span className="ml-1 text-green-400">
            *
          </span>
        )}
      </span>

      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={4}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-green-400/50 focus:ring-1 focus:ring-green-400/20"
        />
      )}
    </label>
  );
}

/* ================================================== */
/* INFO */
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
      <p className="text-[10px] font-black tracking-[0.16em] text-white/25">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-white/70">
        {value}
      </p>
    </div>
  );
}

/* ================================================== */
/* RESULT */
/* ================================================== */

function ResultItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-green-400/10 bg-green-400/[0.04] p-4">
      <p className="text-[10px] font-black tracking-[0.16em] text-white/25">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-green-400">
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
  const config = {
    UPCOMING: {
      label: "Upcoming",
      className:
        "bg-cyan-400/10 text-cyan-300",
    },

    LIVE: {
      label: "Live",
      className:
        "bg-green-400/10 text-green-400",
    },

    QUALIFIED: {
      label: "Qualified",
      className:
        "bg-purple-400/10 text-purple-300",
    },

    COMPLETED: {
      label: "Completed",
      className:
        "bg-white/10 text-white/50",
    },

    CANCELLED: {
      label: "Cancelled",
      className:
        "bg-red-400/10 text-red-300",
    },
  }[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/* ================================================== */
/* EMPTY */
/* ================================================== */

function EmptyState({
  filter,
}: {
  filter: Filter;
}) {
  const messages = {
    UPCOMING:
      "No upcoming tournaments have been created.",
    LIVE:
      "There are no live tournaments right now.",
    QUALIFIED:
      "No tournaments are currently qualified for a next round.",
    COMPLETED:
      "No completed tournaments yet.",
  };

  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl">
        🏆
      </div>

      <h2 className="mt-5 text-xl font-black">
        No tournaments
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
        {messages[filter]}
      </p>
    </div>
  );
}

/* ================================================== */
/* LOADING */
/* ================================================== */

function LoadingState() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="h-[310px] animate-pulse relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent"
        />
      ))}
    </div>
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

/* ================================================== */
/* DATETIME LOCAL */
/* ================================================== */

function toDateTimeLocal(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const pad = (number: number) =>
    number
      .toString()
      .padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(
    date.getDate()
  )}T${pad(
    date.getHours()
  )}:${pad(
    date.getMinutes()
  )}`;
}