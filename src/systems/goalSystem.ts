import { defineQuery, removeComponent } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Goal from "../components/Goal";
import Pushable from "../components/Pushable";
import Texture from "../components/Texture";
import useStore from "../useStore";

const goalQuery = defineQuery([Position, Goal]);
const pushableQuery = defineQuery([Position, Pushable]);

const goalSystem = (world: World) => {
  const goals = goalQuery(world);
  const pushables = pushableQuery(world);
  if (goals.length === 0) {
    return world;
  }
  if (pushables.length === 0) {
    useStore.setState({ hasWon: true });
  } else {
    useStore.setState({ hasWon: false });
  }
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
      Texture.frame[pid] = 7;
    }
  }
  return world;
};

export default goalSystem;
