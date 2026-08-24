"use client";

import Link from "next/link";
import TeamSidebar from "@/components/team-sidebar";

export default function ChatsPage() {
  return (
    <main className="min-h-screen bg-[#02070B] text-slate-100">
      <TeamSidebar />

      <div className="min-h-screen pt-16 lg:ml-[260px] lg:pt-0">
        <header className="border-b border-cyan-400/10 bg-[#040B11] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
                // COMMUNICATIONS NETWORK
              </p>
            </div>

            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Team Chats
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600">
              Private team communication, tactical coordination
              and tournament discussions.
            </p>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1800px] items-center justify-center p-4 sm:p-6 lg:p-8">
          <section className="relative w-full max-w-3xl overflow-hidden border border-cyan-400/10 bg-[#061019]">
            <HudCorners />

            <div className="absolute inset-0 opacity-[0.025] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#67e8f9_4px)]" />

            <div className="relative px-5 py-12 text-center sm:px-10 sm:py-16">
              {/* TERMINAL ICON */}

              <div className="mx-auto flex h-24 w-24 items-center justify-center border border-cyan-400/20 bg-cyan-400/[0.04] shadow-[0_0_40px_rgba(34,211,238,0.06)]">
                <div className="relative flex h-12 w-14 items-center justify-center border border-cyan-400/30">
                  <span className="text-2xl text-cyan-300">
                    ▱
                  </span>

                  <span className="absolute -left-1 -top-1 h-2 w-2 border-l border-t border-cyan-300" />
                  <span className="absolute -right-1 -top-1 h-2 w-2 border-r border-t border-cyan-300" />
                  <span className="absolute -bottom-1 -left-1 h-2 w-2 border-b border-l border-cyan-300" />
                  <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-cyan-300" />
                </div>
              </div>

              <div className="mt-8">
                <span className="inline-flex items-center gap-2 border border-amber-400/20 bg-amber-400/[0.05] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.25em] text-amber-400">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-amber-400" />
                  COMING SOON
                </span>

                <h2 className="mt-5 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  Tactical Chat System
                </h2>

                <p className="mx-auto mt-4 max-w-lg text-xs leading-6 text-slate-600">
                  Team messaging is currently under development.
                  Soon you'll be able to coordinate matches,
                  share strategies and communicate with your
                  squad directly from the command center.
                </p>
              </div>

              {/* FEATURES */}

              <div className="mx-auto mt-10 grid max-w-xl gap-2 sm:grid-cols-3">
                <Feature
                  code="01"
                  title="TEAM CHAT"
                />

                <Feature
                  code="02"
                  title="TACTICAL ROOMS"
                />

                <Feature
                  code="03"
                  title="MATCH COMMS"
                />
              </div>

              {/* STATUS */}

              <div className="mx-auto mt-8 max-w-xl border border-white/5 bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">
                      COMMUNICATIONS
                    </span>
                  </div>

                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-amber-400">
                    STANDBY
                  </span>
                </div>

                <div className="mt-3 h-px bg-white/5">
                  <div className="h-px w-[35%] bg-amber-400/50" />
                </div>
              </div>

              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-3 border border-cyan-400/20 bg-cyan-400/[0.04] px-5 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.08]"
              >
                <span>RETURN TO COMMAND CENTER</span>
                <span>→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  code,
  title,
}: {
  code: string;
  title: string;
}) {
  return (
    <div className="border border-white/5 bg-black/20 p-4 text-left">
      <p className="text-[6px] font-black tracking-[0.25em] text-slate-700">
        {code}
      </p>

      <p className="mt-3 text-[7px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <div className="mt-3 h-px bg-white/5">
        <div className="h-px w-1/3 bg-cyan-400/40" />
      </div>
    </div>
  );
}

/* =========================================================
   HUD CORNERS
========================================================= */

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