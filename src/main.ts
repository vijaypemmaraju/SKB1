import "./style.css";
import { createWorld, pipe } from "bitecs";
import timeSystem from "./systems/timeSystem";
import spriteMovementSystem from "./systems/spriteMovementSystem";
import spriteSystem from "./systems/spriteSystem";
import movementSystem from "./systems/movementSystem";
import World from "./World";
import app from "./app";
import setupGame from "./setup/setupGame";
import { Assets, Sprite, Spritesheet } from "pixi.js";
import textureSystem from "./systems/textureSystem";
import spriteTextureSystem from "./systems/spriteTextureSystem";

const sheet = await Assets.load<Spritesheet>("sheet.json");
const sprite = new Sprite(sheet.textures["sheet 0.aseprite"]);
sprite.anchor.set(0.5);
app.stage.addChild(sprite);

const pipeline = pipe(
  timeSystem,
  spriteSystem,
  movementSystem,
  textureSystem,
  spriteTextureSystem,
  spriteMovementSystem
);

const world = createWorld<World>();
world.time = { delta: 0, elapsed: 0, then: 0 };

setupGame(world);

app.ticker.add(() => {
  pipeline(world);
});
document.body.appendChild(app.view as HTMLCanvasElement);
