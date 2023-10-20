import { AUTO, Game, WEBGL } from "phaser";
import Main from "./scenes/Main";

const width = Math.min(512, window.innerWidth);
const game = new Game({
  width: window.innerWidth,
  height: window.innerHeight / 2,
  antialias: false,
  type: AUTO,
  scene: Main,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  fps: {
    min: 5,
    target: 60,
    forceSetTimeOut: true,
  },
});

export default game;
