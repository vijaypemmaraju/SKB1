import { create } from "zustand";

type Store = {
  hasWon: boolean;
};

const useStore = create<Store>(() => ({
  hasWon: false,
}));

export default useStore;
