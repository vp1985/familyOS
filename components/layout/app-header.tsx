export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">FamilyOS</p>
          <h1 className="text-lg font-bold text-slate-950">Familien-Cockpit</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">F</div>
      </div>
    </header>
  );
}
