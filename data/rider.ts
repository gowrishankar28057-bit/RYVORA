/** Fictional rider profile used by the prototype. */
export const RIDER = {
  name: "Aarav Menon",
  initials: "AM",
  motorcycle: "Royal Enfield Classic 350",
  helmet: "RYVORA Smart Helmet · M",
  memberSince: "Aug 2026",
  stats: { rides: 86, distanceKm: 1284, safeStreakDays: 41 },
  contacts: [
    { name: "Meera Menon", relation: "Sister", phone: "+91 98•••• ••210", primary: true },
    { name: "Rahul Iyer", relation: "Friend", phone: "+91 99•••• ••584", primary: false },
  ],
  /** Rider-entered information shared in the incident package. Not a medical record. */
  notes: "Blood group O+ (rider-entered) · No known allergies (rider-entered)",
};

export const INCIDENT = {
  id: "INC-2026-1004-1412",
  occurredAt: "2026-10-04T14:12:18Z",
  location: { lat: 12.9352, lon: 77.6245, accuracyM: 6, label: "Outer Ring Road, near Agara Junction, Bengaluru" },
};
