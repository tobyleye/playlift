import { create } from "zustand";

type User = {
  name: string;
  picture: string;
};

type Store = {
  user: User | null;
  setUser: (user: User) => void;
};

export const useGlobalStore = create<Store>((set) => ({
  user: null,
  setUser: (user: User) => set({ user: user }),
}));
