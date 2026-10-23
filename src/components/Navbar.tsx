import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";

const LINKS = [
  { href: "/#leistungen", label: "Leistungen" },
  { href: "/#beispiel", label: "Beispiel" },
  { href: "/#rechner", label: "Rechner" },
  { href: "/#preise", label: "Preise" },
  { href: "/#fragen", label: "Fragen" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b bg-paper/95 backdrop-blur-sm transition-colors ${
        scrolled || open ? "border-line" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Logo />

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[0.95rem] text-body transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>

        <Button href="/#kontakt" className="!py-2.5 max-lg:!hidden">
          Erstgespräch vereinbaren
        </Button>

        <button
          className="-mr-2 p-2 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper lg:hidden">
          <div className="flex flex-col px-5 py-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 text-ink last:border-0"
              >
                {link.label}
              </a>
            ))}
            <Button href="/#kontakt" className="my-3">
              Erstgespräch vereinbaren
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
