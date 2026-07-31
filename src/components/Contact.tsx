import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import Reveal from "./Reveal";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="glass glow-border noise relative overflow-hidden rounded-3xl p-8 sm:p-14">
            <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-violet-glow/20 blur-[120px]" />
            <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-cyan-glow/15 blur-[120px]" />

            <div className="relative text-center">
              <span className="text-xs font-semibold tracking-widest text-cyan-glow uppercase">Kontakt</span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Bereit für Ihren <span className="text-gradient">eigenen KI-Agenten?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/60">
                Schreiben Sie uns kurz, worum es geht — wir melden uns mit den nächsten Schritten für eine
                unverbindliche Demo.
              </p>
            </div>

            <div className="relative mt-10">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-cyan-glow" />
                  <p className="font-display text-lg font-semibold text-white">Danke für Ihre Nachricht!</p>
                  <p className="text-sm text-white/60">Wir melden uns in Kürze bei Ihnen zurück.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="mx-auto grid max-w-xl gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Ihr Name"
                        className="w-full rounded-xl border border-line bg-surface-2/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-glow/60 focus:ring-2 focus:ring-violet-glow/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">Unternehmen</label>
                      <input
                        type="text"
                        placeholder="Ihr Unternehmen"
                        className="w-full rounded-xl border border-line bg-surface-2/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-glow/60 focus:ring-2 focus:ring-violet-glow/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/60">E-Mail</label>
                    <input
                      required
                      type="email"
                      placeholder="name@unternehmen.de"
                      className="w-full rounded-xl border border-line bg-surface-2/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-glow/60 focus:ring-2 focus:ring-violet-glow/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/60">Nachricht</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Erzählen Sie uns kurz von Ihrem Vorhaben..."
                      className="w-full resize-none rounded-xl border border-line bg-surface-2/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-glow/60 focus:ring-2 focus:ring-violet-glow/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
                  >
                    Nachricht senden
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
