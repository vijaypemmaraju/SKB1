import { create } from "zustand";

type Store = {
  hasWon: boolean;
  swipe: any;
};

const useStore = create<Store>(() => ({
  hasWon: false,
  swipe: null,
}));

export default useStore;
