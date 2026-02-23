import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import { formatBytes, timeAgo } from "../lib/utils";
import api from "../lib/api";
import { ArrowRight, Upload, MessageSquare, FileText, Shield, Zap } from "lucide-react";

function Stat({ icon, value, label, color = "text-brand-400" }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="text-3xl mb-3">{icon}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-sm text-ink-500 mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [docs, setDocs]     = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/documents/").catch(() => []),
      api.get("/chat/sessions").catch(() => []),
    ]).then(([d, s]) => {
      setDocs(d || []);
      setSessions(s || []);
    }).finally(() => setLoading(false));
  }, []);

  const ready  = docs.filter((d) => d.status === "ready");
  const chunks = ready.reduce((s, d) => s + (d.chunks || 0), 0);
  const hour   = new Date().getHours();
  const greet  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const actions = [
    { icon: Upload,        label: "Upload Document", desc: "Add PDFs to your knowledge base", path: "/documents", color: "bg-brand-500/15 text-brand-400" },
    { icon: MessageSquare, label: "Start Chatting",  desc: "Ask AI about your documents",     path: "/chat",      color: "bg-purple-500/15 text-purple-400" },
    { icon: FileText,      label: "View Documents",  desc: "Manage all your files",           path: "/documents", color: "bg-emerald-500/15 text-emerald-400" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface-900/60 flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-ink-100">{greet}, {user?.full_name?.split(" ")[0] || user?.username} 👋</h1>
          <p className="text-sm text-ink-500 mt-0.5">Your private AI knowledge base</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-up">
          <Stat icon="📄" value={docs.length}         label="Total Documents"   color="text-brand-400" />
          <Stat icon="✅" value={ready.length}        label="Ready to Query"    color="text-emerald-400" />
          <Stat icon="🔮" value={chunks.toLocaleString()} label="Knowledge Chunks" color="text-purple-400" />
          <Stat icon="💬" value={sessions.length}     label="Chat Sessions"     color="text-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent docs */}
          <div className="lg:col-span-2 card p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink-100 flex items-center gap-2 text-sm">
                <FileText size={15} className="text-brand-400" /> Recent Documents
              </h2>
              <button onClick={() => navigate("/documents")}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={11} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => <div key={i} className="h-12 skeleton" />)}
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ink-500 text-sm">No documents yet.</p>
                <button onClick={() => navigate("/documents")} className="btn-primary btn-sm mt-3">
                  Upload your first PDF
                </button>
              </div>
            ) : docs.slice(0, 6).map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center text-lg flex-shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-100 truncate">{doc.original_name}</p>
                  <p className="text-xs text-ink-500">{formatBytes(doc.file_size)} · {timeAgo(doc.created_at)}</p>
                </div>
                <Badge status={doc.status} />
              </div>
            ))}
          </div>

          {/* Quick actions + privacy */}
          <div className="space-y-4 animate-fade-up">
            <div className="card p-5">
              <h2 className="font-bold text-ink-100 text-sm flex items-center gap-2 mb-4">
                <Zap size={15} className="text-amber-400" /> Quick Actions
              </h2>
              {actions.map(({ icon: Icon, label, desc, path, color }) => (
                <button key={label} onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-600 transition-all group mb-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-ink-200 group-hover:text-white transition-colors">{label}</p>
                    <p className="text-xs text-ink-600">{desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-ink-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <div className="card p-4 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex gap-2.5">
                <Shield size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-400 mb-1">Private & Isolated</p>
                  <p className="text-xs text-ink-500 leading-relaxed">
                    Your documents live in an isolated namespace. No other user can see your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
