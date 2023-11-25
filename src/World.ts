import Phaser from "phaser";
import { IWorld } from "bitecs";

type World = IWorld & {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
  currentCamera: Phaser.Cameras.Scene2D.Camera;
  secondaryCamera: Phaser.Cameras.Scene2D.Camera;
  map: (number | undefined)[][];
};

export default World;
