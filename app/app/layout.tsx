import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { requireFamilyContext } from "@/lib/family-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireFamilyContext();

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <AppHeader familyName={context.family.name} userName={context.user.name} />
      <main className="mx-auto w-full max-w-md px-5 py-5">{children}</main>
      <BottomNav renovationModuleEnabled={context.family.renovationModuleEnabled} />
    </div>
  );
}
