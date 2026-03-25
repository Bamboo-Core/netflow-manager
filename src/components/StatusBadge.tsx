interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? "bg-green-900/50 text-green-300 border border-green-700"
          : "bg-gray-800 text-gray-400 border border-gray-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-green-400 animate-pulse" : "bg-gray-500"
        }`}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
