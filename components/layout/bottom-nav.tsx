import Link from "next/link";

const items = [
  { href: "/app", label: "Start", icon: "🏠" },
  { href: "/app/family", label: "Familie", icon: "👨‍👩‍👧" },
  { href: "/app/finance", label: "Geld", icon: "💶" },
  { href: "/app/projects", label: "Projekte", icon: "🧾" },
  { href: "/app/settings", label: "Setup", icon: "⚙️" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-3 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            <span aria-hidden="true" className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
