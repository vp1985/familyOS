import Link from "next/link";

const items = [
  { href: "/app", label: "Start", icon: "🏠" },
  { href: "/app/family", label: "Familie", icon: "👨‍👩‍👧" },
  { href: "/app/finance", label: "Geld", icon: "💶" },
  { href: "/app/budget", label: "Budget", icon: "📊" },
  { href: "/app/calendar", label: "Plan", icon: "🗓️" },
  { href: "/app/kids", label: "Kids", icon: "🧒" },
  { href: "/app/media", label: "Medien", icon: "📱" },
  { href: "/app/tasks", label: "Aufgaben", icon: "✅" },
  { href: "/app/checklists", label: "Listen", icon: "🎒" },
  { href: "/app/tools", label: "Tools", icon: "🧰" },
  { href: "/app/projects", label: "Projekte", icon: "🧾" },
  { href: "/app/rules", label: "Regeln", icon: "📏" },
  { href: "/app/consequences", label: "Folgen", icon: "⏳" },
  { href: "/app/rewards", label: "Punkte", icon: "⭐" },
  { href: "/app/settings", label: "Setup", icon: "⚙️" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className="flex min-w-[4.25rem] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            <span aria-hidden="true" className="text-lg">{item.icon}</span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
