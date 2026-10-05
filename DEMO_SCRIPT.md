# RYVORA — Jury Demo Script (≈3 min)

**0:00–0:20 · Problem** — "Crash-detection today trusts a single impact threshold. Drop your helmet and it calls an ambulance; break the helmet in a real crash and it goes silent."

**0:20–0:40 · Architecture** — "RYVORA links a smart helmet, a bike sensor module and the rider's iQOO smartphone. The phone is the intelligence layer: it fuses all three and keeps a 30-second pre-crash buffer."

**0:40–1:10 · Pre-ride (Steps 1–2)** — "Helmet not worn → start permission blocked. Helmet on, strap buckled → all checks pass, start permission enabled. On hardware, the ESP32 drives the ignition relay."

**1:10–1:35 · Helmet drop (Steps 3–4)** — "Huge helmet impact. But: not worn, bike at 0 km/h, phone calm. RYVORA: HELMET DROP, 98% — no emergency."

**1:35–2:05 · Real crash (Step 5)** — "Worn helmet, bike at 52 km/h, rapid speed loss, bike rotation, phone deceleration, rider stationary. Severe crash, 96% confidence."

**2:05–2:30 · Respond + fail-safe (Steps 6–8)** — "Are you okay? No response → emergency contact, location, incident package (simulated). The helmet link died at impact — phone and bike carried on."

**2:30–2:50 · Black box (Step 9)** — "On the laptop: synchronized speed, helmet, bike and rotation traces, timeline, and a plain-language explanation."

**2:50–3:00 · Close** — "Existing systems detect impact. RYVORA verifies the accident. Three devices. One verified decision."
