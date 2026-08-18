import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BodyMeasurementLog } from "@/types";

function measurementsCol(uid: string) {
  return collection(db, "healthTracker", uid, "bodyMeasurements");
}

export async function getBodyMeasurementLog(uid: string, date: string): Promise<BodyMeasurementLog | null> {
  const snap = await getDoc(doc(measurementsCol(uid), date));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<BodyMeasurementLog, "id">) } : null;
}

export async function upsertBodyMeasurementLog(
  uid: string,
  entry: Omit<BodyMeasurementLog, "id" | "createdAt">,
): Promise<void> {
  const data = Object.fromEntries(
    Object.entries({ ...entry, createdAt: new Date().toISOString() }).filter(([, value]) => value !== undefined)
  );
  await setDoc(doc(measurementsCol(uid), entry.date), data, { merge: true });
}

export async function listBodyMeasurementLogs(uid: string, startDate: string, endDate: string): Promise<BodyMeasurementLog[]> {
  const q = query(measurementsCol(uid), where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BodyMeasurementLog, "id">) }));
}
