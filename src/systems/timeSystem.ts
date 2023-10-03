import World from "../World";
import game from "../game";

const timeSystem = (world: World) => {
  const { time } = world;
  const delta = game.loop.delta / 1000;
  time.then = game.getTime();
  time.delta = delta;
  time.elapsed += delta;
  return world;
};

export default timeSystem;
