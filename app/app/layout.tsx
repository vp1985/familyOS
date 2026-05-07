import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <AppHeader />
      <main className="mx-auto w-full max-w-md px-5 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
