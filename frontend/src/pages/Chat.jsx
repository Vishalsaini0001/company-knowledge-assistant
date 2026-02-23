import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { Send, Plus, Trash2, ChevronDown, FileText, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials, timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";
import api from "../lib/api";

export default function Chat() {
  const { user }   = useAuth();
  const [sessions, setSessions]   = useState([]);
  const [activeId, setActiveId]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [docs,     setDocs]       = useState([]);
  const [selDocs,  setSelDocs]    = useState([]);
  const [input,    setInput]      = useState("");
  const [sending,  setSending]    = useState(false);
  const endRef  = useRef(null);
  const taRef   = useRef(null);

  useEffect(() => {
    api.get("/chat/sessions").then(setSessions).catch(() => {});
    api.get("/documents/").then((d) => setDocs((d || []).filter((x) => x.status === "ready"))).catch(() => {});
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const loadSession = async (id) => {
    setActiveId(id);
    try {
      const s = await api.get(`/chat/sessions/${id}`);
      setMessages(s.messages || []);
    } catch { toast.error("Failed to load chat"); }
  };

  const newChat = () => { setActiveId(null); setMessages([]); };

  const send = async () => {
    if (!input.trim() || sending) return;
    const q = input.trim();
    setInput("");
    if (taRef.current) { taRef.current.style.height = "auto"; }
    setSending(true);
    setMessages((p) => [...p, { role: "user", content: q, ts: new Date().toISOString() }]);
    try {
      const res = await api.post("/chat/query", {
        question: q,
        document_ids: selDocs.length ? selDocs : null,
        session_id: activeId || undefined,
      });
      setMessages((p) => [...p, { role: "assistant", content: res.answer, sources: res.sources, ts: res.created_at }]);
      if (!activeId) {
        setActiveId(res.session_id);
        api.get("/chat/sessions").then(setSessions).catch(() => {});
      }
    } catch (ex) {
      setMessages((p) => p.slice(0, -1));
      toast.error(ex.message);
    } finally {
      setSending(false);
    }
  };

  const delSession = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions((p) => p.filter((s) => s.id !== id));
      if (activeId === id) newChat();
      toast.success("Chat deleted");
    } catch (ex) { toast.error(ex.message); }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const toggleDoc = (id) => setSelDocs((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);
  const userInitials = initials(user?.full_name || user?.username);

  const SUGGESTIONS = [
    "What are the main topics in my documents?",
    "Summarize the key findings",
    "What important dates are mentioned?",
    "List the main conclusions",
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-60 flex-shrink-0 flex flex-col border-r border-border bg-surface-900">
        <div className="p-3 border-b border-border">
          <button onClick={newChat} className="btn-primary w-full btn-sm">
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-xs text-ink-600 text-center py-8 px-3">No chats yet. Ask your first question!</p>
          ) : sessions.map((s) => (
            <div key={s.id}
              onClick={() => loadSession(s.id)}
              className={cn(
                "group flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-all",
                activeId === s.id ? "bg-brand-500/10 border border-brand-500/20" : "hover:bg-surface-700"
              )}>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm mt-0.5",
                activeId === s.id ? "bg-brand-500/20 text-brand-400" : "bg-surface-600 text-ink-400")}>
                💬
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-200 truncate">{s.title}</p>
                <p className="text-[10px] text-ink-600 mt-0.5">{s.message_count} msgs · {timeAgo(s.updated_at)}</p>
              </div>
              <button onClick={(e) => delSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-600 hover:text-red-400 transition-all">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Doc filter */}
        {docs.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface-900/50 flex-wrap flex-shrink-0">
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-widest">Filter:</span>
            <button onClick={() => setSelDocs([])}
              className={cn("text-xs px-3 py-1 rounded-full border transition-all",
                selDocs.length === 0 ? "bg-brand-500/15 border-brand-500/30 text-brand-400" : "border-border text-ink-500 hover:border-border-bright hover:text-ink-300")}>
              All docs
            </button>
            {docs.map((d) => (
              <button key={d.id} onClick={() => toggleDoc(d.id)}
                className={cn("text-xs px-3 py-1 rounded-full border transition-all max-w-[160px] truncate",
                  selDocs.includes(d.id) ? "bg-brand-500/15 border-brand-500/30 text-brand-400" : "border-border text-ink-500 hover:border-border-bright hover:text-ink-300")}
                title={d.original_name}>
                📄 {d.original_name.length > 20 ? d.original_name.slice(0, 20) + "…" : d.original_name}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-4xl">🧠</div>
                <div className="absolute -inset-2 rounded-3xl border border-brand-500/10 animate-pulse" />
              </div>
              <div>
                <h2 className="font-extrabold text-2xl text-ink-100 mb-2">Ask your documents anything</h2>
                <p className="text-ink-500 text-sm max-w-sm">
                  {docs.length === 0
                    ? "Upload some documents first, then come back to chat."
                    : "Your AI reads your documents and answers with citations."}
                </p>
              </div>
              {docs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-sm px-4 py-2 bg-surface-700 hover:bg-surface-600 border border-border hover:border-border-bright text-ink-400 hover:text-ink-200 rounded-full transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} userInitials={userInitials} />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/80 flex items-center justify-center text-sm font-bold flex-shrink-0">🧠</div>
                  <div className="bg-surface-700 border border-border rounded-2xl rounded-tl-sm px-5 py-3.5">
                    <div className="flex gap-1.5 items-center py-0.5">
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-border bg-surface-950/50">
          <div className={cn(
            "flex items-end gap-2 bg-surface-800 border rounded-2xl px-4 py-3 transition-all duration-200",
            "focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/15 border-border"
          )}>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={onKey}
              placeholder="Ask a question about your documents… (Enter to send)"
              className="flex-1 bg-transparent text-sm text-ink-100 placeholder-ink-600 resize-none outline-none leading-relaxed min-h-[24px] max-h-[160px]"
              rows={1}
              disabled={sending}
            />
            <button onClick={send} disabled={sending || !input.trim()}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                input.trim() && !sending
                  ? "bg-brand-500 text-white shadow-[0_0_16px_rgba(13,150,242,.4)] hover:scale-105"
                  : "bg-surface-700 text-ink-600 cursor-not-allowed"
              )}>
              {sending
                ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Send size={15} />}
            </button>
          </div>
          <p className="text-[11px] text-ink-700 mt-2 text-center">DocMind AI may make mistakes — verify important info.</p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg, userInitials }) {
  const isUser = msg.role === "user";
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex gap-3 animate-fade-up", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
        isUser ? "bg-brand-500 text-white" : "bg-brand-500/20 text-brand-400 border border-brand-500/20"
      )}>
        {isUser ? userInitials : "🧠"}
      </div>
      <div className={cn("max-w-[72%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-500/15 border border-brand-500/25 text-ink-100 rounded-tr-sm"
            : "bg-surface-700 border border-border text-ink-100 rounded-tl-sm"
        )}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 w-full">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
              <BookOpen size={11} />
              {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""}
              <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {msg.sources.map((src, i) => (
                  <div key={i} className="bg-surface-800 border border-border rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText size={11} className="text-brand-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-brand-300 truncate">{src.source}</span>
                      <span className="ml-auto text-[10px] text-ink-600 bg-surface-700 px-2 py-0.5 rounded-full flex-shrink-0">p.{src.page}</span>
                    </div>
                    <p className="text-xs text-ink-400 leading-relaxed line-clamp-3">"{src.content}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
