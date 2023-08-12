import { IWorld } from "bitecs";

type World = IWorld & {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
};

export default World;
