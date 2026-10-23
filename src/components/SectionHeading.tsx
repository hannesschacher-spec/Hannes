import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}

export default function SectionHeading({ eyebrow, title, intro, className = "" }: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <p className="text-sm font-medium text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-ink text-balance sm:text-[2.6rem]">
        {title}
      </h2>
      {intro && <p className="mt-5 text-lg leading-relaxed text-body text-pretty">{intro}</p>}
    </div>
  );
}
