import type { Metadata } from "next";
import { AboutPrototypeCard } from "@/components/profile/about-prototype-card";
import { EmergencyContactsCard } from "@/components/profile/emergency-contacts-card";
import { PairedDevicesCard } from "@/components/profile/paired-devices-card";
import { RiderIdentityCard } from "@/components/profile/rider-identity-card";
import { RiderNotesCard } from "@/components/profile/rider-notes-card";
import { SafetySettingsCard } from "@/components/profile/safety-settings-card";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Profile",
  description: "Rider identity, emergency contacts, paired hardware and safety preferences. Demo data.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="Profile"
        title="Rider & settings"
        description="Who you are, who RYVORA would reach, the hardware you ride with and how the rider check behaves."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-7">
        <div className="space-y-5">
          <RiderIdentityCard />
          <EmergencyContactsCard />
          <RiderNotesCard />
        </div>
        <div className="space-y-5">
          <PairedDevicesCard />
          <SafetySettingsCard />
          <AboutPrototypeCard />
        </div>
      </div>
    </div>
  );
}
