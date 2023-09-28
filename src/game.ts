import { Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const game = new Game({
  width: 800,
  height: 800,
  antialias: false,
  type: WEBGL,
  scene: Main,
  pixelArt: true,
});

export default game;
