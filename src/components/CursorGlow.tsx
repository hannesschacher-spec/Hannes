import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 -z-10 hidden h-[400px] w-[400px] rounded-full bg-violet-glow/10 blur-[100px] transition-transform duration-300 ease-out will-change-transform md:block"
    />
  );
}
