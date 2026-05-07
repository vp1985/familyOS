import { logoutAction } from "@/lib/auth";

type AppHeaderProps = {
  familyName: string;
  userName: string;
};

export function AppHeader({ familyName, userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-emerald-600">{familyName}</p>
          <h1 className="truncate text-lg font-bold text-slate-950">Familien-Cockpit</h1>
          <p className="truncate text-xs text-slate-500">Angemeldet als {userName}</p>
        </div>
        <form action={logoutAction}>
          <button
            className="min-h-10 rounded-2xl bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            type="submit"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
