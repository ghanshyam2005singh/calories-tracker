import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityLog } from "@/types";

function activityLogsCol(uid: string) {
  return collection(db, "healthTracker", uid, "activityLogs");
}

export async function getActivityLog(uid: string, date: string): Promise<ActivityLog | null> {
  const snap = await getDoc(doc(activityLogsCol(uid), date));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<ActivityLog, "id">) } : null;
}

export async function upsertActivityLog(uid: string, entry: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
  await setDoc(doc(activityLogsCol(uid), entry.date), { ...entry, createdAt: new Date().toISOString() }, { merge: true });
}

export async function listActivityLogs(uid: string, startDate: string, endDate: string): Promise<ActivityLog[]> {
  const q = query(activityLogsCol(uid), where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLog, "id">) }));
}
