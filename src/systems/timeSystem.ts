import World from "../World";
import app from "../app";

const timeSystem = (world: World) => {
  const { time } = world;
  const delta = app.ticker.deltaTime;
  time.then = time.delta;
  time.delta = delta;
  time.elapsed += delta;
  return world;
};

export default timeSystem;
