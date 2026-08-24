import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050708] px-4 py-8 text-white">
      {/* Tactical background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-green-400/[0.035] blur-3xl" />

        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-400/[0.025] blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />

            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-green-400">
              BGMI ESPORTS COMMAND
            </p>

            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            Team Login
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/35">
            Access your competitive command center
            using your IGN or team username.
          </p>
        </div>

        {/* Login panel */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />

          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
                AUTHENTICATION
              </p>

              <p className="mt-1 text-sm font-bold text-white/60">
                Secure team access
              </p>
            </div>

            <div className="rounded-xl border border-green-400/15 bg-green-400/[0.06] px-3 py-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-green-400">
                SECURE
              </span>
            </div>
          </div>

          <LoginForm />
        </div>

        {/* Register */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.015] px-5 py-4 text-center">
          <p className="text-sm text-white/35">
            New team?{" "}
            <Link
              href="/register"
              className="font-black text-green-400 transition hover:text-green-300"
            >
              Create a team dashboard
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