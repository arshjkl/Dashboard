import { Crosshair } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bgmi-green text-black shadow-neon-sm">
        <Crosshair
          size={21}
          strokeWidth={2.5}
        />
      </div>

      <div>
        <div className="text-sm font-black tracking-tight text-white">
          BGMI
          <span className="text-bgmi-green">
            {" "}ARENA
          </span>
        </div>

        <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-bgmi-muted">
          Team Command
        </div>
      </div>
    </div>
  );
}