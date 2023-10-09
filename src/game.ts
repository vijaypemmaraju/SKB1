import { AUTO, Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const width = Math.min(512, window.innerWidth);
const game = new Game({
  width,
  height: Math.min(512, width),
  antialias: false,
  type: AUTO,
  scene: Main,
  pixelArt: true,
  fps: {
    min: 5,
    target: 60,
    forceSetTimeOut: true,
  },
});

export default game;
