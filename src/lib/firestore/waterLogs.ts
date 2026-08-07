import { doc, getDoc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WaterLog } from "@/types";

function waterLogRef(uid: string, date: string) {
  return doc(db, "healthTracker", uid, "waterLogs", date);
}

export async function getWaterLog(uid: string, date: string): Promise<WaterLog | null> {
  const snap = await getDoc(waterLogRef(uid, date));
  if (!snap.exists()) return null;
  return { id: snap.id, date, ml: (snap.data().ml as number) ?? 0 };
}

// Atomic increment so rapid taps never lose an update to a race condition.
export async function addWater(uid: string, date: string, deltaMl: number): Promise<void> {
  await setDoc(waterLogRef(uid, date), { date, ml: increment(deltaMl) }, { merge: true });
}

export async function resetWater(uid: string, date: string): Promise<void> {
  await setDoc(waterLogRef(uid, date), { date, ml: 0 }, { merge: true });
}
