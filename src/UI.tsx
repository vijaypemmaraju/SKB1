import { FC } from "react";
import useStore from "./useStore";

const UI: FC = () => {
  const hasWon = useStore((state) => state.hasWon);
  return (
    <div>
      {hasWon && <h1 className="text-3xl font-bold">You win!</h1>}
    </div>
  );
};

export default UI;
