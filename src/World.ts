import Phaser from "phaser";
import { IWorld } from "bitecs";

type World = IWorld & {
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
  renderTexture: Phaser.GameObjects.RenderTexture;
  currentCamera: Phaser.Cameras.Scene2D.Camera;
  secondaryCamera: Phaser.Cameras.Scene2D.Camera;
  map: number[][];
};

export default World;
