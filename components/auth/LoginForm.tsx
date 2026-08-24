"use client";

import {
  FormEvent,
  useState,
} from "react";

export function LoginForm() {
  const [
    identifier,
    setIdentifier,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              identifier,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Login failed."
        );

        return;
      }

      window.location.href =
        "/dashboard";
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
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="identifier"
          className="mb-2 block text-sm font-semibold text-white/70"
        >
          IGN / Username
        </label>

        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(event) =>
            setIdentifier(
              event.target.value
            )
          }
          placeholder="Enter IGN or username"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
        />

        <p className="mt-2 text-xs text-white/35">
          Players use their IGN. Owner,
          Manager, Coach and Analyst use
          their username.
        </p>
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-white/70"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-400 px-6 py-3 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Signing In..."
          : "Sign In"}
      </button>
    </form>
  );
}