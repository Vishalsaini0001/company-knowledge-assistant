import { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { Trash2, RefreshCw, Search, Upload } from "lucide-react";
import Badge from "../components/ui/Badge";
import Empty from "../components/ui/Empty";
import { formatBytes, timeAgo } from "../lib/utils";
import api from "../lib/api";

export default function Documents() {
  const [docs,     setDocs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading,setUploading]= useState(false);
  const [progress, setProgress] = useState(0);
  const [search,   setSearch]   = useState("");
  const polls = useRef({});

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try   { setDocs(await api.get("/documents/") || []); }
    catch { toast.error("Failed to load documents"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDocs();
    return () => Object.values(polls.current).forEach(clearInterval);
  }, []);

  const poll = (id) => {
    if (polls.current[id]) return;
    polls.current[id] = setInterval(async () => {
      try {
        const doc = await api.get(`/documents/${id}`);
        setDocs((prev) => prev.map((d) => (d.id === id ? doc : d)));
        if (doc.status === "ready") {
          clearInterval(polls.current[id]);
          delete polls.current[id];
          toast.success(`"${doc.original_name}" is ready!`);
        } else if (doc.status === "error") {
          clearInterval(polls.current[id]);
          delete polls.current[id];
          toast.error(`Failed to process "${doc.original_name}"`);
        }
      } catch { clearInterval(polls.current[id]); }
    }, 3000);
  };

  const uploadFile = async (file) => {
    if (!/\.(pdf|txt)$/i.test(file.name)) { toast.error("Only PDF and TXT files are supported"); return; }
    if (file.size > 50 * 1024 * 1024)     { toast.error("File too large (max 50 MB)");           return; }
    setUploading(true);
    setProgress(10);
    const iv = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 300);
    try {
      const form = new FormData();
      form.append("file", file);
      const doc = await api.post("/documents/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setDocs((prev) => [doc, ...prev]);
      setProgress(100);
      toast.success(`"${file.name}" uploaded – processing…`);
      poll(doc.id);
    } catch (ex) {
      toast.error(ex.message);
    } finally {
      clearInterval(iv);
      setTimeout(() => { setUploading(false); setProgress(0); }, 600);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.forEach(uploadFile),
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    multiple: false,
    disabled: uploading,
  });

  const del = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch (ex) { toast.error(ex.message); }
  };

  const filtered = docs.filter((d) =>
    d.original_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface-900/60 flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-ink-100">Documents</h1>
          <p className="text-sm text-ink-500 mt-0.5">{docs.length} file{docs.length !== 1 ? "s" : ""} in your knowledge base</p>
        </div>
        <button onClick={fetchDocs} className="btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-5">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={[
            "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 overflow-hidden",
            isDragActive  ? "border-brand-500 bg-brand-500/8 scale-[1.01]"    : "",
            uploading     ? "border-amber-500/40 bg-amber-500/5 cursor-wait"  : "",
            !isDragActive && !uploading ? "border-border hover:border-border-bright hover:bg-surface-800/40" : "",
          ].join(" ")}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragActive ? "bg-brand-500/20 scale-110" : "bg-surface-700"}`}>
              <Upload size={26} className={isDragActive ? "text-brand-400" : "text-ink-500"} />
            </div>
            <div>
              <p className="font-extrabold text-lg text-ink-100">
                {uploading ? "Uploading…" : isDragActive ? "Drop it!" : "Upload documents"}
              </p>
              <p className="text-sm text-ink-500 mt-1">
                {uploading ? "Processing, please wait" : "Drag & drop or click · PDF, TXT · Max 50 MB"}
              </p>
            </div>
            {!uploading && !isDragActive && (
              <button type="button" className="btn-primary btn-sm mt-1" onClick={(e) => e.stopPropagation()}>
                Browse Files
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-600">
              <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Search */}
        {docs.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input className="input pl-10" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 space-y-3 animate-pulse">
                <div className="flex gap-3"><div className="w-10 h-10 skeleton rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 skeleton" /><div className="h-3 skeleton w-2/3" /></div></div>
                <div className="h-5 skeleton rounded-full w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          docs.length === 0
            ? <Empty icon="📂" title="No documents yet" desc="Upload your first PDF to start building your private AI knowledge base." />
            : <Empty icon="🔍" title="No results" desc={`Nothing matching "${search}"`} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doc) => <DocCard key={doc.id} doc={doc} onDelete={del} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function DocCard({ doc, onDelete }) {
  return (
    <div className="card p-5 group hover:border-border-bright hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,.4)] transition-all duration-200 animate-fade-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl flex-shrink-0">📄</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink-100 truncate" title={doc.original_name}>{doc.original_name}</p>
          <p className="text-xs text-ink-500 mt-0.5">{formatBytes(doc.file_size)}</p>
        </div>
        <button
          onClick={() => onDelete(doc.id, doc.original_name)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Badge status={doc.status} />
        <div className="flex gap-3 text-xs text-ink-500">
          {doc.pages  > 0 && <span>{doc.pages}p</span>}
          {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
        </div>
      </div>

      {doc.status === "processing" && (
        <div className="mt-3">
          <div className="h-1 bg-surface-600 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-brand-500 rounded-full animate-pulse" />
          </div>
          <p className="text-[11px] text-amber-400 mt-1.5">Indexing…</p>
        </div>
      )}

      <p className="text-[11px] text-ink-600 mt-3">{timeAgo(doc.created_at)}</p>
    </div>
  );
}
