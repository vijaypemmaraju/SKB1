import { FC } from "react";
import useStore from "./useStore";

const UI: FC = () => {
  const hasWon = useStore((state) => state.hasWon);
  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
      {hasWon && <h1 className="text-3xl font-bold">You win!</h1>}
    </div>
  );
};

export default UI;
