import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Food } from "@/types";

function foodsCol(uid: string) {
  return collection(db, "healthTracker", uid, "foods");
}

export async function listFoods(uid: string): Promise<Food[]> {
  const q = query(foodsCol(uid), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Food, "id">) }));
}

export async function addFood(uid: string, food: Omit<Food, "id" | "createdAt">): Promise<Food> {
  const ref = await addDoc(foodsCol(uid), {
    ...food,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id, ...food, createdAt: new Date().toISOString() };
}

export async function deleteFood(uid: string, foodId: string): Promise<void> {
  await deleteDoc(doc(foodsCol(uid), foodId));
}
