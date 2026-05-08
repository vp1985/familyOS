import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { getGamificationPageData } from "@/lib/gamification";
import { assignBadgeAction, createPointTransactionAction, createRewardAction, redeemRewardAction } from "./actions";

function signed(points: number) {
  return points > 0 ? `+${points}` : points.toString();
}

export default async function RewardsPage() {
  const { members, balances, pointTransactions, rewards, redemptions } = await getGamificationPageData();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Motivation</p>
        <h2 className="text-2xl font-bold text-slate-950">Punkte & Belohnungen</h2>
        <p className="mt-1 text-sm text-slate-600">Positive Entwicklung sichtbar machen: Punkte, Einlösungen und Badges.</p>
      </div>

      {members.length === 0 ? (
        <EmptyState title="Noch keine Kinder" description="Lege zuerst Familienprofile an, danach können Punkte und Badges vergeben werden." />
      ) : null}

      <section className="grid gap-3">
        {balances.map(({ member, points, badges }) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{member.icon ?? "👤"} {member.name}</CardTitle>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{points} Punkte</span>
              </div>
            </CardHeader>
            {badges.length > 0 ? (
              <CardContent className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge.id} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{badge.icon} {badge.title}</span>
                ))}
              </CardContent>
            ) : null}
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>Punkte vergeben oder abziehen</CardTitle></CardHeader>
        <CardContent>
          <form action={createPointTransactionAction} className="space-y-3">
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="points-familyMemberId">
              Kind
              <select id="points-familyMemberId" name="familyMemberId" required defaultValue="" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="" disabled>Bitte wählen</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <FormField label="Punkte" name="points" type="number" placeholder="z. B. 10 oder -5" required />
            <FormField label="Grund" name="reason" placeholder="z. B. Hausaufgaben erledigt" required />
            <Button type="submit" disabled={members.length === 0}>Speichern</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Belohnung anlegen</CardTitle></CardHeader>
        <CardContent>
          <form action={createRewardAction} className="space-y-3">
            <FormField label="Belohnung" name="title" placeholder="z. B. Filmabend" required />
            <FormField label="Kosten in Punkten" name="costPoints" type="number" min="1" placeholder="30" required />
            <FormField label="Beschreibung optional" name="description" placeholder="z. B. am Wochenende" />
            <Button type="submit">Belohnung speichern</Button>
          </form>
        </CardContent>
      </Card>

      {rewards.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-950">Belohnungen</h3>
          {rewards.map((reward) => (
            <Card key={reward.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{reward.title}</CardTitle>
                    {reward.description ? <p className="text-sm text-slate-600">{reward.description}</p> : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{reward.costPoints} Punkte</span>
                </div>
              </CardHeader>
              <CardContent>
                <form action={redeemRewardAction} className="grid grid-cols-[1fr_auto] gap-2">
                  <input type="hidden" name="rewardId" value={reward.id} />
                  <select name="familyMemberId" required defaultValue="" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                    <option value="" disabled>Kind wählen</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                  <Button type="submit" className="px-3 text-xs">Einlösen</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Badge vergeben</CardTitle></CardHeader>
        <CardContent>
          <form action={assignBadgeAction} className="space-y-3">
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="badge-familyMemberId">
              Kind
              <select id="badge-familyMemberId" name="familyMemberId" required defaultValue="" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="" disabled>Bitte wählen</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-[84px_1fr] gap-3">
              <FormField label="Icon" name="icon" placeholder="🏅" />
              <FormField label="Badge" name="badgeTitle" placeholder="z. B. Mathe-Held" required />
            </div>
            <FormField label="Beschreibung optional" name="badgeDescription" placeholder="Warum wurde der Badge vergeben?" />
            <Button type="submit" disabled={members.length === 0}>Badge vergeben</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Punkteverlauf</h3>
        {pointTransactions.length === 0 ? <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">Noch keine Punktebewegungen.</p> : null}
        {pointTransactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div>
              <p className="font-semibold text-slate-950">{transaction.member.name}</p>
              <p className="text-slate-600">{transaction.reason}</p>
            </div>
            <span className={transaction.points > 0 ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{signed(transaction.points)}</span>
          </div>
        ))}
      </section>

      {redemptions.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-950">Einlösungen</h3>
          {redemptions.map((redemption) => (
            <div key={redemption.id} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <p className="font-semibold text-slate-950">{redemption.reward.title}</p>
              <p className="text-slate-600">{redemption.member.name} · {redemption.costPoints} Punkte</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
