import { Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const width = Math.min(512, window.innerWidth);
const game = new Game({
  width,
  height: Math.min(512, width),
  antialias: false,
  type: WEBGL,
  scene: Main,
  pixelArt: true,
});

export default game;
