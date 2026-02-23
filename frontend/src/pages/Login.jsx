import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthWrap from "../components/AuthWrap";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [f, setF]   = useState({ email: "", password: "" });
  const [show, setShow]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await api.post("/auth/login", f);
      login(res.access_token, res.user);
      toast.success(`Welcome back, ${res.user.full_name || res.user.username}!`);
      navigate("/dashboard");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthWrap
      title="Welcome back"
      sub="Sign in to your private AI knowledge base."
      switchHref="/register"
      switchText="No account?"
      switchLabel="Create one →"
    >
      {err && (
        <div className="mb-5 flex gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <span>⚠</span> {err}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input
              type="email" className="input pl-10"
              placeholder="you@company.com"
              value={f.email} onChange={set("email")} required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input
              type={show ? "text" : "password"} className="input pl-10 pr-10"
              placeholder="••••••••"
              value={f.password} onChange={set("password")} required
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300 transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={busy}>
          {busy
            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in…</>
            : <>Sign In <ArrowRight size={15} /></>}
        </button>
      </form>
    </AuthWrap>
  );
}
