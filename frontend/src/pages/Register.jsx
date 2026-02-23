import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import AuthWrap from "../components/AuthWrap";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Register() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [f, setF]  = useState({ full_name: "", username: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const strength = (() => {
    const p = f.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9!@#$]/.test(p)) s++;
    return s;
  })();

  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-brand-400", "bg-emerald-500"][strength];

  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setErr("");
    setBusy(true);
    try {
      const res = await api.post("/auth/register", f);
      login(res.access_token, res.user);
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthWrap
      title="Create account"
      sub="Build your private AI document workspace."
      switchHref="/login"
      switchText="Already have an account?"
      switchLabel="Sign in →"
    >
      {err && (
        <div className="mb-5 flex gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <span>⚠</span> {err}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Full Name</label>
            <input className="input" placeholder="John Doe" value={f.full_name} onChange={set("full_name")} />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
              <input className="input pl-10" placeholder="johndoe" value={f.username} onChange={set("username")} required />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input type="email" className="input pl-10" placeholder="you@company.com" value={f.email} onChange={set("email")} required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input
              type={show ? "text" : "password"} className="input pl-10 pr-10"
              placeholder="Min 6 characters"
              value={f.password} onChange={set("password")} required
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-300 transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {f.password && (
            <div className="flex gap-1 mt-2">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-border"}`} />
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={busy}>
          {busy
            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating…</>
            : <>Create Account <ArrowRight size={15} /></>}
        </button>
      </form>
    </AuthWrap>
  );
}
