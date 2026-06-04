import { cn } from "@/lib/utils";

interface Orb {
  color: string;
  size: number;
  top: string;
  left?: string;
  right?: string;
  delay: number;
  floatDuration?: number;
  breathDuration?: number;
  hideMobile?: boolean;
}

const ORBS: Orb[] = [
  { color: "rgba(14,165,233,0.3)", size: 600, top: "-15%", left: "-10%", delay: 0 },
  {
    color: "rgba(16,185,129,0.25)",
    size: 500,
    top: "-5%",
    right: "-8%",
    delay: 2,
    hideMobile: true,
  },
  { color: "rgba(245,158,11,0.2)", size: 400, top: "40%", left: "50%", delay: 1, hideMobile: true },
  { color: "rgba(239,68,68,0.15)", size: 350, top: "70%", left: "-5%", delay: 3, hideMobile: true },
  { color: "rgba(139,92,246,0.2)", size: 450, top: "60%", right: "-5%", delay: 1.5 },
];

export function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full motion-safe:animate-orb",
            orb.hideMobile && "hidden md:block",
          )}
          style={
            {
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left as string | undefined,
              right: orb.right as string | undefined,
              background: `radial-gradient(circle at center, ${orb.color} 0%, transparent 70%)`,
              "--orb-delay": `${orb.delay}s`,
              "--orb-float-duration": `${orb.floatDuration || 20}s`,
              "--orb-breath-duration": `${orb.breathDuration || 8}s`,
              willChange: "transform, opacity",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
