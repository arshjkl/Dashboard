import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050708] px-4 py-10 text-white sm:py-14">
      {/* Tactical background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-green-400/[0.035] blur-3xl" />

        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.025] blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />

            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-green-400">
              BGMI ESPORTS COMMAND
            </p>

            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Create Team Dashboard
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/35">
            Establish your competitive team command
            center and administrator account.
          </p>
        </div>

        {/* Registration panel */}
        <div className="mx-auto max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />

            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
                  TEAM REGISTRATION
                </p>

                <p className="mt-1 text-sm font-bold text-white/60">
                  Initialize your command center
                </p>
              </div>

              <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] px-3 py-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-green-400">
                  NEW TEAM
                </span>
              </div>
            </div>

            <RegisterForm />
          </div>
        </div>

        {/* Login link */}
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/5 bg-white/[0.015] px-5 py-4 text-center">
          <p className="text-sm text-white/35">
            Already have a team?{" "}
            <Link
              href="/login"
              className="font-black text-green-400 transition hover:text-green-300"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[9px] font-black uppercase tracking-[0.25em] text-white/15">
          COMPETITIVE OPERATIONS PLATFORM
        </p>
      </div>
    </main>
  );
}