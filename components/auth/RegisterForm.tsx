"use client";

import { FormEvent, useState } from "react";

export function RegisterForm() {
  const [teamName, setTeamName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [managerName, setManagerName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamName,
            ownerName,
            managerName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to create team."
        );
        return;
      }

      sessionStorage.setItem(
        "bgmi_onboarding",
        JSON.stringify({
          teamId: data.team.id,
          teamName: data.team.name,
          teamSlug: data.team.slug,
          ownerName: data.setup.ownerName,
          managerName: data.setup.managerName,
        })
      );

      window.location.href =
        "/register/setup";
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section>
        <label className="mb-2 block text-sm font-semibold text-white/70">
          Team Name
        </label>

        <input
          type="text"
          value={teamName}
          onChange={(event) =>
            setTeamName(event.target.value)
          }
          placeholder="e.g. VER Esports"
          required
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-semibold text-white/70">
          Owner Name
        </label>

        <input
          type="text"
          value={ownerName}
          onChange={(event) =>
            setOwnerName(event.target.value)
          }
          placeholder="Owner's full name"
          required
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-semibold text-white/70">
          Manager Name
        </label>

        <input
          type="text"
          value={managerName}
          onChange={(event) =>
            setManagerName(event.target.value)
          }
          placeholder="Manager's full name"
          required
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
        />
      </section>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-semibold text-white/70">
          Admin permissions
        </p>

        <p className="mt-1 text-xs leading-5 text-white/40">
          Owner and Manager have equal
          administrative permissions. You can
          choose whether they use one account or
          separate accounts on the next step.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-400 px-6 py-4 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Team..."
          : "Create Team"}
      </button>
    </form>
  );
}