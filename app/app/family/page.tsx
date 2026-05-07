import { EmptyState } from "@/components/ui/empty-state";
import { requireFamilyContext } from "@/lib/family-context";

export default async function FamilyPage() {
  const context = await requireFamilyContext();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">{context.family.name}</p>
        <h2 className="text-2xl font-bold text-slate-950">Familie</h2>
      </div>
      <EmptyState
        title="Kinderprofile kommen in Sprint 2"
        description="Der Familienkontext ist da. Als Nächstes werden Kinder und Familienmitglieder angelegt."
      />
    </div>
  );
}
