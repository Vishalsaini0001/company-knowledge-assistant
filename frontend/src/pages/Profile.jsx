import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { User, Mail, Lock, Shield, Edit3, Save, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials, fmtDate } from "../lib/utils";
import api from "../lib/api";

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px",
        active ? "border-brand-500 text-brand-400" : "border-transparent text-ink-500 hover:text-ink-200 hover:border-border-bright",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Profile() {
  const { user, patch } = useAuth();
  const [tab,     setTab]     = useState("info");
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ full_name: user?.full_name || "", username: user?.username || "" });
  const [saving,  setSaving]  = useState(false);
  const [stats,   setStats]   = useState({ docs: 0, chats: 0, chunks: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/documents/").catch(() => []),
      api.get("/chat/sessions").catch(() => []),
    ]).then(([docs, chats]) => {
      const ready = (docs || []).filter((d) => d.status === "ready");
      setStats({ docs: docs?.length || 0, chats: chats?.length || 0, chunks: ready.reduce((s, d) => s + (d.chunks || 0), 0) });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put("/auth/profile", form);
      patch(updated);
      setEditing(false);
      toast.success("Profile updated ✓");
    } catch (ex) { toast.error(ex.message); }
    finally { setSaving(false); }
  };

  const ini    = initials(user?.full_name || user?.username);
  const joined = fmtDate(user?.created_at);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 py-5 border-b border-border bg-surface-900/60 flex-shrink-0">
        <h1 className="text-xl font-extrabold text-ink-100">Profile</h1>
        <p className="text-sm text-ink-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: user card */}
          <div className="space-y-4">
            <div className="card overflow-hidden animate-fade-up">
              <div className="h-20 bg-gradient-to-br from-brand-500/50 via-purple-600/30 to-brand-600/20 relative">
                <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(13,150,242,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(13,150,242,.06) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
              </div>
              <div className="px-5 pb-5">
                <div className="-mt-7 mb-3 relative inline-block">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-xl font-extrabold text-white border-4 border-surface-700 shadow-[0_0_20px_rgba(13,150,242,.3)]">
                    {ini}
                  </div>
                </div>
                <p className="font-extrabold text-lg text-ink-100">{user?.full_name || user?.username}</p>
                <p className="text-sm text-brand-400 font-semibold">@{user?.username}</p>
                <p className="text-xs text-ink-500 mt-1">{user?.email}</p>
                {joined && <p className="text-xs text-ink-600 mt-1">Member since {joined}</p>}

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { v: stats.docs,   l: "Docs"   },
                    { v: stats.chats,  l: "Chats"  },
                    { v: stats.chunks, l: "Chunks" },
                  ].map(({ v, l }) => (
                    <div key={l} className="bg-surface-800 rounded-xl p-3 text-center">
                      <p className="font-extrabold text-lg text-brand-400">{v}</p>
                      <p className="text-[10px] text-ink-600">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-4 border-emerald-500/20 bg-emerald-500/5 animate-fade-up">
              <div className="flex gap-2.5">
                <Shield size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-400 mb-1">Isolated & Private</p>
                  <p className="text-xs text-ink-500 leading-relaxed">Your data is in a private namespace. No other user can access it.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: tabs */}
          <div className="lg:col-span-2 animate-fade-up">
            <div className="flex border-b border-border mb-5">
              <TabBtn active={tab === "info"} onClick={() => setTab("info")}><User size={14} /> Personal Info</TabBtn>
              <TabBtn active={tab === "sec"}  onClick={() => setTab("sec")} ><Shield size={14} /> Security</TabBtn>
            </div>

            {tab === "info" && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-ink-100">Personal Information</h3>
                  {!editing
                    ? <button onClick={() => setEditing(true)} className="btn-ghost btn-sm"><Edit3 size={13} /> Edit</button>
                    : <button onClick={() => setEditing(false)} className="btn-ghost btn-sm"><X size={13} /> Cancel</button>}
                </div>

                {editing ? (
                  <form onSubmit={save} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Full Name</label>
                      <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-600 text-sm">@</span>
                        <input className="input pl-8" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Email</label>
                      <input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
                      <p className="text-xs text-ink-600 mt-1.5">Email cannot be changed.</p>
                    </div>
                    <button type="submit" className="btn-primary btn-sm" disabled={saving}>
                      {saving ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</> : <><Save size={13} /> Save Changes</>}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "Full Name",  value: user?.full_name || "—", icon: User },
                      { label: "Username",   value: `@${user?.username}`,   icon: null },
                      { label: "Email",      value: user?.email,            icon: Mail },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center flex-shrink-0 text-ink-500">
                          {Icon ? <Icon size={14} /> : <span className="text-sm">@</span>}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">{label}</p>
                          <p className="text-sm font-semibold text-ink-100 mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "sec" && (
              <div className="space-y-4">
                <div className="card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                      <Lock size={16} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-100 text-sm">Password</h3>
                      <p className="text-xs text-ink-500 mt-0.5">Stored as a bcrypt hash. Never readable.</p>
                    </div>
                  </div>
                </div>

                <div className="card p-5 border-emerald-500/20 bg-emerald-500/5">
                  <h3 className="font-bold text-ink-100 text-sm mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-emerald-400" /> Data Isolation
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Documents stored at uploads/user_{id}/ — fully isolated",
                      "Vector embeddings at chroma_db/user_{id}/ — separate per user",
                      "All API queries enforce user_id filtering",
                      "JWT tokens expire after 7 days",
                      "Zero cross-user data leakage by design",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-ink-400">
                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card p-5">
                  <h3 className="font-bold text-ink-100 text-sm mb-3">Session Details</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      ["Token type",   "JWT HS256"],
                      ["Expiry",       "7 days"],
                      ["User ID",      user?.id],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-ink-500">{k}</span>
                        <span className="font-mono text-ink-300 text-[11px] truncate max-w-[200px]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
