import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FoodLog } from "@/types";

function foodLogsCol(uid: string) {
  return collection(db, "healthTracker", uid, "foodLogs");
}

export async function listFoodLogsForDate(uid: string, date: string): Promise<FoodLog[]> {
  // Avoids needing a composite index: equality-only query, sorted client-side.
  const q = query(foodLogsCol(uid), where("date", "==", date));
  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FoodLog, "id">) }));
  return logs.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

export async function listFoodLogsForRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<FoodLog[]> {
  const q = query(
    foodLogsCol(uid),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FoodLog, "id">) }));
}

export async function addFoodLog(uid: string, entry: Omit<FoodLog, "id" | "createdAt">): Promise<void> {
  await addDoc(foodLogsCol(uid), {
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export async function updateFoodLog(
  uid: string,
  logId: string,
  updates: Partial<Omit<FoodLog, "id">>
): Promise<void> {
  await updateDoc(doc(foodLogsCol(uid), logId), updates);
}

export async function deleteFoodLog(uid: string, logId: string): Promise<void> {
  await deleteDoc(doc(foodLogsCol(uid), logId));
}
