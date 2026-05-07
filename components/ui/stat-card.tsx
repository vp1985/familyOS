import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
