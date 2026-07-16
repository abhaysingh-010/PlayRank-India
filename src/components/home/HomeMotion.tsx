import type { ReactNode } from "react";

export function PageProgress() {
  return <div aria-hidden className="pr-page-progress" />;
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  return (
    <div className={`pr-reveal ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const lines = [
  [{ text: "THE DATA LAYER" }],
  [{ text: "FOR " }, { text: "INDIAN", accent: true }],
  [{ text: "ESPORTS." }],
];

export function HeroTitle() {
  return (
    <h1 className="pr-display max-w-[1160px]" aria-label="The data layer for Indian esports">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block overflow-hidden pb-[0.08em]">
          <span className="pr-hero-line block" style={{ animationDelay: `${0.08 + lineIndex * 0.1}s` }}>
            {line.map((part, partIndex) => (
              <span key={partIndex} className={part.accent ? "text-[var(--pr-red)]" : undefined}>
                {part.text}
              </span>
            ))}
          </span>
        </span>
      ))}
    </h1>
  );
}

export function AnimatedCount({ value }: { value: number }) {
  return <>{value.toLocaleString("en-IN")}</>;
}
