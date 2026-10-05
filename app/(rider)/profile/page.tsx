import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, SimLabel, buttonClass } from "@/components/ui/primitives";
import { RIDER } from "@/data/rider";
export const metadata: Metadata = { title: "Profile" };
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="flex items-center gap-4 p-5"><span className="grid size-14 place-items-center rounded-2xl bg-navy text-lg font-extrabold text-white">{RIDER.initials}</span><div><h1 className="text-xl font-extrabold">{RIDER.name}</h1><p className="text-sm text-muted">{RIDER.motorcycle} · {RIDER.helmet}</p></div></Card>
      <Card className="p-5"><CardHeader title="Emergency contacts" action={<SimLabel>Demo data</SimLabel>} />
        <ul className="mt-3 space-y-2">{RIDER.contacts.map((c) => <li key={c.name} className="flex justify-between rounded-2xl bg-surface p-3 text-sm"><span className="font-bold text-navy">{c.name} <span className="font-normal text-muted">· {c.relation}</span></span><span className="text-muted">{c.phone}</span></li>)}</ul>
        <p className="mt-3 text-xs text-muted">{RIDER.notes}</p></Card>
      <Card className="p-5"><CardHeader title="About this prototype" /><p className="mt-2 text-sm text-body">Hardware data is simulated. Emergency communication is demonstrated, not performed. RYVORA does not provide medical diagnosis.</p><Link href="/jury-demo" className={buttonClass("dark", "md", "mt-4")}>Open Jury Demo</Link></Card>
    </div>
  );
}
