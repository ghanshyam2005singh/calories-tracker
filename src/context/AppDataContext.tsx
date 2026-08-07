"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { getProfile } from "@/lib/firestore/profile";
import { listFoods } from "@/lib/firestore/foods";
import type { Food, Profile } from "@/types";

interface AppDataContextValue {
  profile: Profile | null;
  foods: Food[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshFoods: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

// Lives in the (app) layout, which Next.js keeps mounted across route
// changes within that segment - so profile/foods load once per session
// instead of on every page visit, which is most of what made switching
// tabs feel slow.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getProfile(user.uid));
  }, [user]);

  const refreshFoods = useCallback(async () => {
    if (!user) return;
    setFoods(await listFoods(user.uid));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setFoods([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getProfile(user.uid), listFoods(user.uid)])
      .then(([p, f]) => {
        setProfile(p);
        setFoods(f);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppDataContext.Provider value={{ profile, foods, loading, refreshProfile, refreshFoods }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
