"use client";

import { animate, motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export function PageProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.25 });

  return <motion.div aria-hidden className="pr-page-progress" style={{ scaleX }} />;
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  distance = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const lines = [
  [{ text: "THE DATA LAYER" }],
  [{ text: "FOR " }, { text: "INDIAN", accent: true }],
  [{ text: "ESPORTS." }],
];

export function HeroTitle() {
  const reduceMotion = useReducedMotion();

  return (
    <h1 className="pr-display max-w-[1160px]" aria-label="The data layer for Indian esports">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={reduceMotion ? false : { y: "115%", rotate: 1.2 }}
            animate={reduceMotion ? undefined : { y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.12 + lineIndex * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {line.map((part, partIndex) => (
              <span key={partIndex} className={part.accent ? "text-[var(--pr-red)]" : undefined}>
                {part.text}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function AnimatedCount({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.8 });

  useEffect(() => {
    if (!ref.current || !isInView) return;

    if (reduceMotion) {
      ref.current.textContent = value.toLocaleString("en-IN");
      return undefined;
    }

    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString("en-IN");
      },
    });

    return () => controls.stop();
  }, [isInView, reduceMotion, value]);

  return <span ref={ref}>{reduceMotion ? value.toLocaleString("en-IN") : "0"}</span>;
}
