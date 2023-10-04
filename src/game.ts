import { Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const game = new Game({
  width: 512,
  height: 512,
  antialias: false,
  type: WEBGL,
  scene: Main,
  pixelArt: true,
});

export default game;
