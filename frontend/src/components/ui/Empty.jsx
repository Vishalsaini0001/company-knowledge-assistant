export default function Empty({ icon = "📂", title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="font-bold text-lg text-ink-100 mb-2">{title}</h3>
      <p className="text-ink-500 text-sm max-w-xs leading-relaxed">{desc}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
