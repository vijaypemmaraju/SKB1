import { AUTO, Game, WEBGL } from "phaser";
import Main2 from "./scenes/Main2";
import Main3 from "./scenes/Main3";

const width = Math.min(512, window.innerWidth);
const game = new Game({
  width: window.innerWidth,
  height: window.innerHeight,
  // height: window.innerHeight / 2,
  antialias: false,
  type: AUTO,
  scene: Main3,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  fps: {
    min: 5,
    target: 60,
    forceSetTimeOut: true,
  },
});

if (import.meta.hot) {
  import.meta.hot.accept("/src/scenes/Main2.ts", (module) => {
    location.reload();
    game.scene.remove("Main2");
    const newScene = module.default as typeof Main2;
    console.log(module);
    game.scene.add("Main2", newScene, true);
  });
}

export default game;
