import { Application } from "pixi.js";

const app = new Application({
  background: "#1099bb",
  resizeTo: window,
  width: window.innerWidth,
  height: window.innerHeight,
});

export default app;
