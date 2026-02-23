const MAP = {
  ready:      "badge-ready",
  processing: "badge-processing",
  pending:    "badge-pending",
  error:      "badge-error",
};

const DOT = {
  ready:      "bg-emerald-400",
  processing: "bg-amber-400 animate-pulse",
  pending:    "bg-ink-400",
  error:      "bg-red-400",
};

export default function Badge({ status }) {
  return (
    <span className={MAP[status] ?? "badge-pending"}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status] ?? "bg-ink-400"}`} />
      {status ?? "pending"}
    </span>
  );
}
