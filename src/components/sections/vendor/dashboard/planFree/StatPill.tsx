export function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-white/80 px-3 py-3 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
