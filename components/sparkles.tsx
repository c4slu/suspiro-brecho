"use client";

type SparkleConfig = {
  top: string;
  left: string;
  color: string;
  size: number;
  delay: number;
  duration: number;
};

const SPARKLES: SparkleConfig[] = [
  { top: "6%",  left: "4%",  color: "#D4888A", size: 18, delay: 0,    duration: 2.8 },
  { top: "12%", left: "91%", color: "#C4973F", size: 14, delay: 0.8,  duration: 3.2 },
  { top: "28%", left: "96%", color: "#7A9E7E", size: 22, delay: 1.5,  duration: 2.5 },
  { top: "52%", left: "2%",  color: "#C4973F", size: 12, delay: 0.4,  duration: 3.6 },
  { top: "68%", left: "94%", color: "#D4888A", size: 16, delay: 2.1,  duration: 2.9 },
  { top: "80%", left: "6%",  color: "#7A9E7E", size: 20, delay: 1.1,  duration: 3.4 },
  { top: "90%", left: "88%", color: "#C4973F", size: 10, delay: 0.6,  duration: 2.6 },
  { top: "38%", left: "98%", color: "#D4888A", size: 14, delay: 1.8,  duration: 3.0 },
  { top: "20%", left: "1%",  color: "#7A9E7E", size: 16, delay: 2.4,  duration: 2.7 },
  { top: "74%", left: "1%",  color: "#D4888A", size: 12, delay: 0.9,  duration: 3.3 },
  { top: "45%", left: "97%", color: "#C4973F", size: 18, delay: 1.6,  duration: 2.4 },
  { top: "94%", left: "40%", color: "#7A9E7E", size: 10, delay: 3.0,  duration: 4.0 },
];

function StarSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: "block" }}
    >
      <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
    </svg>
  );
}

export function Sparkles() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="animate-sparkle"
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            "--dur": `${s.duration}s`,
            "--delay": `${s.delay}s`,
          } as React.CSSProperties}
        >
          <StarSVG size={s.size} color={s.color} />
        </div>
      ))}
    </div>
  );
}
