export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="animate-float-slow absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-glow/25 blur-[120px]" />
      <div className="animate-float absolute top-[20%] -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-glow/20 blur-[120px]" />
      <div className="animate-float-slow absolute bottom-[-10%] left-[15%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-glow/15 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
    </div>
  );
}
