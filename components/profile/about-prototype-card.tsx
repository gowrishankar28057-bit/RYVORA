import { Cpu, Presentation, ShieldCheck, Siren, Stethoscope } from "lucide-react";
import { ButtonLink, Card, CardHeader } from "@/components/ui/primitives";

const POINTS = [
  {
    Icon: Cpu,
    title: "Simulated hardware",
    body: "Helmet, bike-module and phone sensor data come from a simulator. Flip faults with the hardware simulator to see how the app reacts.",
  },
  {
    Icon: Siren,
    title: "Demonstrated emergency workflow",
    body: "Rider check, contact notification and the incident package are shown, never sent. The browser does not contact emergency services or control the motorcycle.",
  },
  {
    Icon: ShieldCheck,
    title: "No single point of failure",
    body: "The phone keeps a rolling pre-crash buffer. If the helmet is lost, phone and bike finish the verification.",
  },
  {
    Icon: Stethoscope,
    title: "No medical diagnosis",
    body: "RYVORA estimates crash likelihood from motion data. It does not assess injuries, and hospital integration is not part of this prototype.",
  },
];

export function AboutPrototypeCard() {
  return (
    <Card className="p-5">
      <CardHeader kicker="Hackathon MVP" title="About this prototype" />
      <ul className="mt-3 space-y-3">
        {POINTS.map(({ Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">{title}</span>
              <span className="block text-sm leading-relaxed text-body">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <ButtonLink href="/jury-demo" variant="dark" size="md" className="mt-5 w-full sm:w-auto">
        <Presentation className="size-[18px]" aria-hidden /> Open Jury Demo
      </ButtonLink>
    </Card>
  );
}
