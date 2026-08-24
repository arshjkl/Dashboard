"use client";

import Link from "next/link";
import TeamSidebar from "@/components/team-sidebar";

export default function CommsPage() {
  return (
    <main className="min-h-screen bg-[#02070B] text-slate-100">
      <TeamSidebar />

      <div className="min-h-screen pt-16 lg:ml-[260px] lg:pt-0">
        {/* HEADER */}

        <header className="border-b border-cyan-400/10 bg-[#040B11] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />

              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-cyan-400">
                // OPERATIONS COMMUNICATIONS
              </p>
            </div>

            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Comms Center
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600">
              Tactical communication channels for matches,
              tournaments and team operations.
            </p>
          </div>
        </header>

        {/* MAIN */}

        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[1800px] items-center justify-center p-4 sm:p-6 lg:p-8">
          <section className="relative w-full max-w-4xl overflow-hidden border border-cyan-400/10 bg-[#061019]">
            <HudCorners />

            <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#67e8f9_4px)]" />

            <div className="relative px-5 py-10 sm:px-10 sm:py-14">
              {/* TOP STATUS */}

              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center border border-cyan-400/20 bg-cyan-400/[0.04] shadow-[0_0_40px_rgba(34,211,238,0.06)]">
                  <div className="relative flex h-14 w-16 items-center justify-center border border-cyan-400/30">
                    <span className="text-2xl text-cyan-300">
                      ◉
                    </span>

                    <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-300" />
                    <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-300" />
                    <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-300" />
                    <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-300" />
                  </div>
                </div>

                <div className="mt-7">
                  <span className="inline-flex items-center gap-2 border border-amber-400/20 bg-amber-400/[0.05] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.25em] text-amber-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-amber-400" />
                    COMING SOON
                  </span>

                  <h2 className="mt-5 text-2xl font-black uppercase tracking-tight sm:text-4xl">
                    Tactical Comms Network
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl text-xs leading-6 text-slate-600 sm:text-sm">
                    Real-time team communication is currently
                    under development. Voice coordination,
                    match channels and tournament communications
                    will be available from this command center.
                  </p>
                </div>
              </div>

              {/* COMMUNICATION GRID */}

              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <CommsChannel
                  code="01"
                  icon="◉"
                  title="MATCH COMMS"
                  description="Live communication during competitive matches."
                  status="OFFLINE"
                />

                <CommsChannel
                  code="02"
                  icon="◈"
                  title="TEAM CHANNEL"
                  description="Private communication for your squad."
                  status="LOCKED"
                />

                <CommsChannel
                  code="03"
                  icon="◆"
                  title="TOURNAMENT"
                  description="Event-specific communication channels."
                  status="LOCKED"
                />
              </div>

              {/* SIGNAL STATUS */}

              <div className="mt-8 border border-white/5 bg-black/20 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-600">
                      COMMUNICATION NETWORK
                    </p>

                    <p className="mt-1 text-sm font-black uppercase text-slate-400">
                      Awaiting Deployment
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-amber-400">
                      STANDBY
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-px bg-white/5">
                  <div className="h-px w-[42%] bg-gradient-to-r from-amber-400/70 to-transparent" />
                </div>

                <div className="mt-3 flex justify-between text-[6px] font-bold uppercase tracking-[0.2em] text-slate-800">
                  <span>
                    SIGNAL
                  </span>

                  <span>
                    42%
                  </span>
                </div>
              </div>

              {/* FUTURE FEATURES */}

              <div className="mt-8 border-t border-white/5 pt-6">
                <p className="text-center text-[7px] font-black uppercase tracking-[0.3em] text-slate-700">
                  PLANNED SYSTEMS
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <FutureFeature
                    title="VOICE"
                  />

                  <FutureFeature
                    title="PUSH TO TALK"
                  />

                  <FutureFeature
                    title="MATCH ROOMS"
                  />

                  <FutureFeature
                    title="TEAM ALERTS"
                  />
                </div>
              </div>

              {/* RETURN */}

              <div className="mt-8 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 border border-cyan-400/20 bg-cyan-400/[0.04] px-5 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.08]"
                >
                  <span>
                    RETURN TO COMMAND CENTER
                  </span>

                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   COMMS CHANNEL
========================================================= */

function CommsChannel({
  code,
  icon,
  title,
  description,
  status,
}: {
  code: string;
  icon: string;
  title: string;
  description: string;
  status: "OFFLINE" | "LOCKED";
}) {
  return (
    <div className="group relative overflow-hidden border border-white/5 bg-black/20 p-5 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.025]">
      <span className="absolute right-3 top-3 text-[6px] font-black tracking-[0.2em] text-slate-800">
        {code}
      </span>

      <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/10 bg-cyan-400/[0.03] text-lg text-cyan-400/50 transition group-hover:border-cyan-400/20 group-hover:text-cyan-400">
        {icon}
      </div>

      <h3 className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h3>

      <p className="mt-2 min-h-[40px] text-[8px] leading-5 text-slate-700">
        {description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-[6px] font-black uppercase tracking-[0.2em] text-slate-700">
          CHANNEL
        </span>

        <span className="border border-slate-700/50 px-2 py-1 text-[6px] font-black uppercase tracking-wider text-slate-700">
          {status}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   FUTURE FEATURE
========================================================= */

function FutureFeature({
  title,
}: {
  title: string;
}) {
  return (
    <div className="border border-white/5 bg-white/[0.015] px-3 py-3 text-center">
      <span className="text-[6px] font-black uppercase tracking-[0.18em] text-slate-700">
        {title}
      </span>
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