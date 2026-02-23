export default function Loader({ full = false }) {
  const dots = (
    <div className="flex gap-1.5">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );

  if (full) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(13,150,242,.4)]">
              🧠
            </div>
            <div className="absolute -inset-1.5 rounded-2xl border border-brand-500/30 animate-pulse" />
          </div>
          {dots}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">{dots}</div>
  );
}
