"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TeamData = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

type MeResponse = {
  authenticated: boolean;
  team?: TeamData | null;
  roles?: string[];
};

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "⌂",
    code: "01",
  },
  {
    name: "Roster",
    href: "/team/roster",
    icon: "♙",
    code: "02",
  },
  {
    name: "Tournaments",
    href: "/tournaments",
    icon: "◈",
    code: "03",
  },
  {
    name: "Chats",
    href: "/chats",
    icon: "▱",
    code: "04",
  },
  {
    name: "Comms",
    href: "/comms",
    icon: "◉",
    code: "05",
  },
];

export default function TeamSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [team, setTeam] =
    useState<TeamData | null>(null);

  const [roles, setRoles] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    async function loadSidebar() {
      try {
        const response = await fetch(
          "/api/me",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data: MeResponse =
          await response.json();

        if (!data.authenticated) {
          return;
        }

        setTeam(data.team || null);

        setRoles(
          Array.isArray(data.roles)
            ? data.roles
            : []
        );
      } catch {
        // Keep sidebar usable.
      } finally {
        setLoading(false);
      }
    }

    loadSidebar();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navigationItems = [
    navigation[0],

    {
      name: "My Profile",
      href: "/player/profile",
      icon: "◎",
      code: "P",
    },

    ...navigation.slice(1),
  ];

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to log out."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const roleLabel =
    roles.includes("OWNER")
      ? "OWNER"
      : roles.includes("MANAGER")
        ? "MANAGER"
        : roles.includes("COACH")
          ? "COACH"
          : roles.includes("ANALYST")
            ? "ANALYST"
            : roles.includes("PLAYER")
              ? "PLAYER"
              : "OPERATOR";

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-cyan-400/10 bg-[#02070B]/95 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            {team?.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-black text-cyan-300">
                {team?.name
                  ?.charAt(0)
                  .toUpperCase() || "T"}
              </span>
            )}

            <span className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-cyan-300" />
            <span className="absolute right-0 top-0 h-1.5 w-1.5 border-r border-t border-cyan-300" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-wider text-white">
              {loading
                ? "Loading..."
                : team?.name || "Team"}
            </p>

            <p className="text-[6px] font-bold uppercase tracking-[0.25em] text-cyan-500">
              {roleLabel} // COMMAND
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (value) => !value
            )
          }
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03] text-lg text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
        >
          {mobileOpen ? "×" : "☰"}
        </button>
      </div>

      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#02070B]/95 pt-16 backdrop-blur-xl lg:hidden">
          <nav className="h-full overflow-y-auto px-4 py-5">
            <div className="mb-5 border border-cyan-400/10 bg-[#061019] p-4">
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-cyan-500">
                // CURRENT OPERATOR
              </p>

              <p className="mt-2 text-sm font-black uppercase">
                {team?.name || "TEAM"}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  {roleLabel} // AUTHENTICATED
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {navigationItems.map(
                (item) => {
                  const active =
                    pathname ===
                      item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      active={active}
                    />
                  );
                }
              )}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <Link
                href="/team/profile"
                className="block border border-white/5 bg-white/[0.02] p-4"
              >
                <p className="text-[7px] font-black uppercase tracking-[0.25em] text-slate-600">
                  TEAM PROFILE
                </p>

                <p className="mt-2 truncate text-sm font-black uppercase text-slate-300">
                  {team?.name ||
                    "Team Profile"}
                </p>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-3 flex w-full items-center justify-between border border-red-400/10 bg-red-400/[0.03] p-4 text-left text-[8px] font-black uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                <span>
                  {loggingOut
                    ? "Logging out..."
                    : "Terminate Session"}
                </span>

                <span>↪</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-cyan-400/10 bg-[#02070B] text-white lg:flex">
        {/* Scanline overlay */}

        <div className="pointer-events-none absolute inset-0 opacity-[0.018] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#67e8f9_4px)]" />

        {/* =================================================
            TEAM HEADER
        ================================================= */}

        <Link
          href="/team/profile"
          className="group relative border-b border-cyan-400/10 p-5 transition hover:bg-cyan-400/[0.025]"
        >
          <HudCorners />

          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-cyan-400/30 bg-cyan-400/5 shadow-[0_0_25px_rgba(34,211,238,0.05)]">
              {team?.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-cyan-300">
                  {team?.name
                    ?.charAt(0)
                    .toUpperCase() ||
                    "T"}
                </span>
              )}

              <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-300" />
              <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-300" />
              <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-300" />
              <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-300" />
            </div>

            <div className="min-w-0">
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-cyan-500">
                TEAM COMMAND
              </p>

              <p className="mt-1 truncate text-lg font-black uppercase tracking-wide">
                {loading
                  ? "Loading..."
                  : team?.name || "Team"}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[6px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-3 px-3 pt-2 text-[6px] font-black uppercase tracking-[0.35em] text-slate-700">
            // SYSTEM MODULES
          </p>

          {navigationItems.map(
            (item) => {
              const active =
                pathname ===
                  item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <DesktopNavItem
                  key={item.href}
                  item={item}
                  active={active}
                />
              );
            }
          )}
        </nav>

        {/* =================================================
            SYSTEM STATUS
        ================================================= */}

        <div className="relative border-t border-cyan-400/10 p-3">
          <div className="mb-3 border border-cyan-400/5 bg-cyan-400/[0.02] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[6px] font-black uppercase tracking-[0.25em] text-slate-700">
                NETWORK
              </p>

              <span className="flex items-center gap-1.5 text-[6px] font-black uppercase text-emerald-400">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                ONLINE
              </span>
            </div>

            <div className="mt-3 h-px bg-white/5">
              <div className="h-px w-[92%] bg-cyan-400/60" />
            </div>
          </div>

          <Link
            href="/team/profile"
            className="block border border-white/5 bg-white/[0.02] p-3 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]"
          >
            <p className="text-[6px] font-black uppercase tracking-[0.25em] text-slate-700">
              TEAM PROFILE
            </p>

            <p className="mt-1 truncate text-[9px] font-black uppercase text-slate-400">
              {team?.name ||
                "Team Profile"}
            </p>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-2 flex w-full items-center justify-between border border-red-400/5 px-3 py-3 text-left text-[7px] font-black uppercase tracking-[0.2em] text-red-400/60 transition hover:border-red-400/20 hover:bg-red-400/[0.05] hover:text-red-400 disabled:opacity-50"
          >
            <span>
              {loggingOut
                ? "Terminating..."
                : "Terminate Session"}
            </span>

            <span className="text-sm">
              ↪
            </span>
          </button>

          <p className="mt-3 text-center text-[5px] font-bold uppercase tracking-[0.25em] text-slate-800">
            TEAM OPS // SECURE NETWORK
          </p>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   DESKTOP NAV ITEM
========================================================= */

function DesktopNavItem({
  item,
  active,
}: {
  item: {
    name: string;
    href: string;
    icon: string;
    code: string;
  };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 overflow-hidden px-3 py-3 transition ${
        active
          ? "border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
          : "border border-transparent text-slate-500 hover:border-white/5 hover:bg-white/[0.025] hover:text-slate-200"
      }`}
    >
      {active && (
        <>
          <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

          <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-400/50" />

          <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-400/50" />
        </>
      )}

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center border text-base transition ${
          active
            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            : "border-white/5 bg-white/[0.02] text-slate-600 group-hover:border-white/10 group-hover:text-slate-300"
        }`}
      >
        {item.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[8px] font-black uppercase tracking-[0.18em]">
          {item.name}
        </span>

        <span
          className={`mt-0.5 block text-[5px] font-bold uppercase tracking-[0.25em] ${
            active
              ? "text-cyan-500"
              : "text-slate-800"
          }`}
        >
          MODULE {item.code}
        </span>
      </span>

      <span
        className={`text-[9px] transition ${
          active
            ? "translate-x-0 text-cyan-400"
            : "-translate-x-1 text-slate-800 group-hover:translate-x-0 group-hover:text-slate-500"
        }`}
      >
        →
      </span>
    </Link>
  );
}

/* =========================================================
   MOBILE NAV ITEM
========================================================= */

function MobileNavItem({
  item,
  active,
}: {
  item: {
    name: string;
    href: string;
    icon: string;
    code: string;
  };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-4 border px-4 py-4 transition ${
        active
          ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
          : "border-white/5 bg-white/[0.015] text-slate-500 hover:bg-white/[0.03]"
      }`}
    >
      {active && (
        <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
      )}

      <span
        className={`flex h-11 w-11 items-center justify-center border ${
          active
            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            : "border-white/5 bg-white/[0.02] text-slate-600"
        }`}
      >
        {item.icon}
      </span>

      <div className="flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.2em]">
          {item.name}
        </p>

        <p
          className={`mt-1 text-[6px] font-bold uppercase tracking-[0.25em] ${
            active
              ? "text-cyan-500"
              : "text-slate-700"
          }`}
        >
          MODULE {item.code}
        </p>
      </div>

      <span className="text-slate-700">
        →
      </span>
    </Link>
  );
}

/* =========================================================
   HUD CORNERS
========================================================= */

function HudCorners() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-cyan-300/60" />

      <span className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-cyan-300/60" />

      <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-cyan-300/60" />

      <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-cyan-300/60" />
    </>
  );
}