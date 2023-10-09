import { FC } from "react";
import useStore from "./useStore";

const UI: FC = () => {
  const hasWon = useStore((state) => state.hasWon);
  return (
    <div className="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-full pointer-events-none">
      {/* {hasWon && <h1 className="text-3xl font-bold">You win!</h1>} */}
    </div>
  );
};

export default UI;
