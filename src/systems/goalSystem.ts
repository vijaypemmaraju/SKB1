import { defineQuery, removeComponent } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Goal from "../components/Goal";
import Pushable from "../components/Pushable";

const goalQuery = defineQuery([Position, Goal]);
const pushableQuery = defineQuery([Position, Pushable]);

const goalSystem = (world: World) => {
  const goals = goalQuery(world);
  const pushables = pushableQuery(world);
  for (let i = 0; i < pushables.length; i++) {
    const pid = pushables[i];
    if (
      goals.some(
        (gid) =>
          Position.x[gid] === Position.x[pid] &&
          Position.y[gid] === Position.y[pid],
      )
    ) {
      removeComponent(world, Pushable, pid);
    }
  }
  return world;
};

export default goalSystem;
