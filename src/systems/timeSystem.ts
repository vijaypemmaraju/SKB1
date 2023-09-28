import World from "../World";
import game from "../game";

const timeSystem = (world: World) => {
  const { time } = world;
  const delta = game.getTime() - time.then;
  time.then = time.delta;
  time.delta = delta;
  time.elapsed += delta;
  return world;
};

export default timeSystem;
