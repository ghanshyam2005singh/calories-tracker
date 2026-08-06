import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Profile } from "@/types";

function profileRef(uid: string) {
  return doc(db, "healthTracker", uid);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return (data.profile as Profile) ?? null;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  const existing = await getDoc(profileRef(uid));
  await setDoc(
    profileRef(uid),
    {
      profile: {
        ...profile,
        createdAt: existing.exists() && existing.data().profile?.createdAt
          ? existing.data().profile.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      _touchedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
