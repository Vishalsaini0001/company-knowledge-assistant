import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthWrap({ children, title, sub, switchHref, switchLabel, switchText }) {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-5 relative overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-80 bg-brand-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-purple-600/6 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,150,242,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(13,150,242,.05) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="bg-surface-900/90 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,.6)]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_0_20px_rgba(13,150,242,.4)]">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent">
              DocMind AI
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-ink-100 mb-1">{title}</h1>
          <p className="text-ink-500 text-sm mb-8">{sub}</p>

          {children}

          {switchHref && (
            <p className="mt-6 text-center text-sm text-ink-500">
              {switchText}{" "}
              <Link to={switchHref} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                {switchLabel}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
