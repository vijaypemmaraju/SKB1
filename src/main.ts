import "./style.css";
import { createWorld, pipe } from "bitecs";
import timeSystem from "./systems/timeSystem";
import spriteSystem from "./systems/spriteSystem";
import movementSystem from "./systems/movementSystem";
import World from "./World";
import app from "./app";
import setupGame from "./setup/setupGame";

const pipeline = pipe(timeSystem, movementSystem, spriteSystem);

const world = createWorld<World>();
world.time = { delta: 0, elapsed: 0, then: 0 };

setupGame(world);

app.ticker.add(() => {
  pipeline(world);
});
