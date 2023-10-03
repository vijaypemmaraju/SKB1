import { Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const game = new Game({
  width: 1024,
  height: 1024,
  antialias: false,
  type: WEBGL,
  scene: Main,
  pixelArt: true,
});

export default game;
