"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type OnboardingData = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  ownerName: string;
  managerName: string;
};

type AccountForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyAccount: AccountForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SetupPage() {
  const [onboarding, setOnboarding] =
    useState<OnboardingData | null>(null);

  const [samePerson, setSamePerson] =
    useState(false);

  const [owner, setOwner] =
    useState<AccountForm>({
      ...emptyAccount,
    });

  const [manager, setManager] =
    useState<AccountForm>({
      ...emptyAccount,
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        "bgmi_onboarding"
      );

    if (!stored) {
      window.location.href =
        "/register";

      return;
    }

    try {
      const parsed =
        JSON.parse(
          stored
        ) as OnboardingData;

      if (
        !parsed.teamId ||
        !parsed.teamName ||
        !parsed.ownerName ||
        !parsed.managerName
      ) {
        sessionStorage.removeItem(
          "bgmi_onboarding"
        );

        window.location.href =
          "/register";

        return;
      }

      setOnboarding(parsed);
    } catch {
      sessionStorage.removeItem(
        "bgmi_onboarding"
      );

      window.location.href =
        "/register";
    }
  }, []);

  function updateOwner(
    field: keyof AccountForm,
    value: string
  ) {
    setOwner((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateManager(
    field: keyof AccountForm,
    value: string
  ) {
    setManager((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!onboarding) {
      setError(
        "Your onboarding session has expired. Please register again."
      );

      return;
    }

    if (
      owner.password.length < 6
    ) {
      setError(
        "Owner password must be at least 6 characters."
      );

      return;
    }

    if (
      owner.password !==
      owner.confirmPassword
    ) {
      setError(
        "Owner passwords do not match."
      );

      return;
    }

    if (
      owner.username.trim().length < 3
    ) {
      setError(
        "Owner username must be at least 3 characters."
      );

      return;
    }

    if (!samePerson) {
      if (
        manager.password.length < 6
      ) {
        setError(
          "Manager password must be at least 6 characters."
        );

        return;
      }

      if (
        manager.password !==
        manager.confirmPassword
      ) {
        setError(
          "Manager passwords do not match."
        );

        return;
      }

      if (
        manager.username.trim().length < 3
      ) {
        setError(
          "Manager username must be at least 3 characters."
        );

        return;
      }

      if (
        owner.username
          .trim()
          .toLowerCase() ===
        manager.username
          .trim()
          .toLowerCase()
      ) {
        setError(
          "Owner and Manager must use different usernames."
        );

        return;
      }
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/setup",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              teamId:
                onboarding.teamId,

              ownerName:
                onboarding.ownerName,

              managerName:
                onboarding.managerName,

              samePerson,

              owner: {
                username:
                  owner.username
                    .trim()
                    .toLowerCase(),

                email:
                  owner.email
                    .trim()
                    .toLowerCase(),

                password:
                  owner.password,
              },

              ...(samePerson
                ? {}
                : {
                    manager: {
                      username:
                        manager.username
                          .trim()
                          .toLowerCase(),

                      email:
                        manager.email
                          .trim()
                          .toLowerCase(),

                      password:
                        manager.password,
                    },
                  }),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to configure accounts."
        );

        return;
      }

      sessionStorage.removeItem(
        "bgmi_onboarding"
      );

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "Admin setup request failed:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!onboarding) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0c] text-white">
        <p className="text-white/50">
          Loading team setup...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0c] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-green-400">
            TEAM SETUP
          </p>

          <h1 className="text-3xl font-black md:text-4xl">
            Configure Admin Accounts
          </h1>

          <p className="mt-3 text-sm text-white/40">
            {onboarding.teamName}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-1 text-xl font-black">
              Owner
            </h2>

            <p className="mb-5 text-sm text-white/40">
              {onboarding.ownerName}
            </p>

            <AccountFields
              value={owner}
              onChange={updateOwner}
              namePrefix="owner"
            />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <button
              type="button"
              onClick={() =>
                setSamePerson(
                  (current) => !current
                )
              }
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <h2 className="font-black">
                  Owner and Manager are
                  the same person
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Use one login with both
                  OWNER and MANAGER
                  permissions.
                </p>
              </div>

              <div
                className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  samePerson
                    ? "bg-green-400"
                    : "bg-white/10"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white transition ${
                    samePerson
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </section>

          {!samePerson && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-1 text-xl font-black">
                Manager
              </h2>

              <p className="mb-5 text-sm text-white/40">
                {onboarding.managerName}
              </p>

              <AccountFields
                value={manager}
                onChange={
                  updateManager
                }
                namePrefix="manager"
              />
            </section>
          )}

          {samePerson && (
            <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-5">
              <p className="font-bold text-green-400">
                Single administrator
              </p>

              <p className="mt-1 text-sm text-white/50">
                <span className="font-semibold text-white/70">
                  {onboarding.ownerName}
                </span>{" "}
                will have both Owner and
                Manager permissions and will
                use one login.
              </p>
            </div>
          )}

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
              ? "Setting Up..."
              : "Complete Team Setup"}
          </button>
        </form>
      </div>
    </main>
  );
}

function AccountFields({
  value,
  onChange,
  namePrefix,
}: {
  value: AccountForm;
  onChange: (
    field: keyof AccountForm,
    value: string
  ) => void;
  namePrefix: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Username"
        value={value.username}
        onChange={(value) =>
          onChange(
            "username",
            value
              .toLowerCase()
              .replace(/\s/g, "")
          )
        }
        placeholder={`${namePrefix}01`}
        required
      />

      <Field
        label="Email"
        type="email"
        value={value.email}
        onChange={(value) =>
          onChange("email", value)
        }
        placeholder="Optional"
      />

      <Field
        label="Password"
        type="password"
        value={value.password}
        onChange={(value) =>
          onChange(
            "password",
            value
          )
        }
        placeholder="Minimum 6 characters"
        required
      />

      <Field
        label="Confirm Password"
        type="password"
        value={
          value.confirmPassword
        }
        onChange={(value) =>
          onChange(
            "confirmPassword",
            value
          )
        }
        placeholder="Repeat password"
        required
      />
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
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-green-400/50"
      />
    </label>
  );
}