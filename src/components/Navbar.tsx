import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";

const LINKS = [
  { href: "#services", label: "Lösungen" },
  { href: "#process", label: "Ablauf" },
  { href: "#features", label: "Vorteile" },
  { href: "#pricing", label: "Preise" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "border-b border-line/80 bg-ink/70 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-glow to-cyan-glow">
            <Zap className="h-4.5 w-4.5 text-ink" strokeWidth={2.5} />
          </span>
          Neural<span className="text-gradient">Sales</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#contact"
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            Kontakt
          </a>
          <a
            href="#contact"
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            Demo anfragen
          </a>
        </div>

        <button
          className="text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü öffnen"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-line/80 bg-ink/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-4 py-3 text-center text-sm font-semibold text-ink"
              >
                Demo anfragen
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
