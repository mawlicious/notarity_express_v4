import { DateTime } from "luxon";
import type { Slot } from "./types.js";

export function renderSlot(startsAt: string, userZone: string): string {
  const instant = DateTime.fromISO(startsAt, { setZone: true });
  if (!instant.isValid || !DateTime.local().setZone(userZone).isValid) throw new Error("Invalid slot or timezone");
  const user = instant.setZone(userZone).toFormat("ccc, dd LLL yyyy HH:mm ZZZZ");
  const vienna = instant.setZone("Europe/Vienna").toFormat("ccc, dd LLL yyyy HH:mm ZZZZ");
  return userZone === "Europe/Vienna" ? user : `${user} / ${vienna} (Vienna)`;
}

export function closestSlots(slots: Slot[], preferredIso: string, count = 3): Slot[] {
  const target = DateTime.fromISO(preferredIso).toMillis();
  return [...slots]
    .filter((slot) => DateTime.fromISO(slot.startsAt).toMillis() > Date.now())
    .sort((a, b) => Math.abs(DateTime.fromISO(a.startsAt).toMillis() - target) - Math.abs(DateTime.fromISO(b.startsAt).toMillis() - target))
    .slice(0, count);
}

export function reminderTimes(slotIso: string, now = DateTime.utc()): DateTime[] {
  const slot = DateTime.fromISO(slotIso, { setZone: true }).toUTC();
  return [slot.minus({ hours: 24 }), slot.minus({ hours: 1 })].filter((time) => time > now);
}
