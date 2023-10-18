import Phaser from "phaser";
import { IWorld } from "bitecs";

type World = IWorld & {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
  renderTexture: Phaser.GameObjects.RenderTexture;
  map: number[][]
};

export default World;
