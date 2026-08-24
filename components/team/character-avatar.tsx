"use client";

type CharacterAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "ONLINE" | "READY" | "OFFLINE" | "LIVE" | null;
  role?: string | null;
  number?: number | null;
};

const sizeClasses = {
  xs: "h-9 w-9 text-xs",
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-4xl",
};

const statusClasses = {
  ONLINE:
    "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.7)]",

  READY:
    "bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.7)]",

  OFFLINE:
    "bg-slate-700 text-slate-300",

  LIVE:
    "bg-red-400 text-white shadow-[0_0_12px_rgba(248,113,113,0.7)]",
};

export default function CharacterAvatar({
  name,
  avatarUrl,
  photoUrl,
  size = "md",
  status = null,
  role = null,
  number = null,
}: CharacterAvatarProps) {
  const image =
    avatarUrl ||
    photoUrl ||
    null;

  const initial =
    name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "?";

  return (
    <div className="relative shrink-0">
      {/* Avatar frame */}

      <div
        className={`
          relative
          overflow-hidden
          border
          border-cyan-400/30
          bg-[#07111A]
          ${sizeClasses[size]}
          shadow-[0_0_18px_rgba(34,211,238,0.08)]
        `}
      >
        {/* Technical corner lines */}

        <span className="pointer-events-none absolute left-0 top-0 z-10 h-2 w-2 border-l border-t border-cyan-300/70" />

        <span className="pointer-events-none absolute right-0 top-0 z-10 h-2 w-2 border-r border-t border-cyan-300/70" />

        <span className="pointer-events-none absolute bottom-0 left-0 z-10 h-2 w-2 border-b border-l border-cyan-300/70" />

        <span className="pointer-events-none absolute bottom-0 right-0 z-10 h-2 w-2 border-b border-r border-cyan-300/70" />

        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#102431] via-[#07111A] to-[#02070B]">
            {/* Scanline effect */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-20
                [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(34,211,238,0.18)_4px)]
              "
            />

            {/* Character silhouette */}

            <div className="relative flex flex-col items-center">
              <div className="h-[32%] w-[32%] rounded-full border border-cyan-400/30 bg-cyan-400/5" />

              <div className="mt-1 h-[38%] w-[55%] rounded-t-[45%] border border-cyan-400/20 bg-cyan-400/5" />

              <span className="absolute inset-0 flex items-center justify-center font-black text-cyan-400">
                {initial}
              </span>
            </div>
          </div>
        )}

        {/* Bottom role strip */}

        {role && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#02070B]/90 px-1 py-1 text-center">
            <span className="block truncate text-[7px] font-black uppercase tracking-[0.16em] text-cyan-300">
              {role}
            </span>
          </div>
        )}
      </div>

      {/* Player number */}

      {number !== null && (
        <div className="absolute -left-2 -top-2 z-20 flex h-6 min-w-6 items-center justify-center border border-cyan-400/20 bg-[#02070B] px-1 text-[8px] font-black text-cyan-300">
          {String(number).padStart(2, "0")}
        </div>
      )}

      {/* Status */}

      {status && (
        <div
          className={`
            absolute
            -bottom-1
            -right-1
            z-20
            flex
            items-center
            gap-1
            border
            border-[#02070B]
            px-1.5
            py-0.5
            text-[6px]
            font-black
            tracking-[0.12em]
            ${statusClasses[status]}
          `}
        >
          <span
            className={`
              h-1 w-1 rounded-full
              ${
                status === "OFFLINE"
                  ? "bg-slate-400"
                  : "animate-pulse bg-current"
              }
            `}
          />

          {status}
        </div>
      )}
    </div>
  );
}