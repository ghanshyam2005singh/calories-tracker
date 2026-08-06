import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WeightLog } from "@/types";

function weightLogsCol(uid: string) {
  return collection(db, "healthTracker", uid, "weightLogs");
}

export async function getWeightLog(uid: string, date: string): Promise<WeightLog | null> {
  const snap = await getDoc(doc(weightLogsCol(uid), date));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<WeightLog, "id">) };
}

export async function upsertWeightLog(
  uid: string,
  entry: Omit<WeightLog, "id" | "createdAt"> & { id?: string }
): Promise<void> {
  const id = entry.id ?? entry.date;
  await setDoc(
    doc(weightLogsCol(uid), id),
    {
      date: entry.date,
      weightKg: entry.weightKg,
      bodyFatPct: entry.bodyFatPct ?? null,
      note: entry.note ?? null,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deleteWeightLog(uid: string, date: string): Promise<void> {
  await deleteDoc(doc(weightLogsCol(uid), date));
}

export async function listWeightLogs(
  uid: string,
  startDate: string,
  endDate: string
): Promise<WeightLog[]> {
  const q = query(
    weightLogsCol(uid),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WeightLog, "id">) }));
}

export async function getLatestWeightLog(uid: string): Promise<WeightLog | null> {
  const q = query(weightLogsCol(uid), orderBy("date", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<WeightLog, "id">) };
}
