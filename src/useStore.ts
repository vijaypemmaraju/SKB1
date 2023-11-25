import { ForceGraphInstance } from "force-graph";
import { create } from "zustand";

type Store = {
  hasWon: boolean;
  swipe: any;
  forceGraphInstance: ForceGraphInstance | null;
};

const useStore = create<Store>(() => ({
  hasWon: false,
  swipe: null,
  forceGraphInstance: null,
}));

window.useStore = useStore;

export default useStore;
