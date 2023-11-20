import { defineQuery, removeComponent, removeEntity } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Goal from "../components/Goal";
import Pushable from "../components/Pushable";
import Texture from "../components/Texture";
import useStore from "../useStore";
import Interactible from "../components/Interactible";

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
          Position.y[gid] === Position.y[pid]
      )
    ) {
      removeComponent(world, Pushable, pid);
      removeEntity(world, Interactible.cursor[pid]);
      removeComponent(world, Interactible, pid);
      Texture.frame[pid] = 2;
    }
  }
  return world;
};

export default goalSystem;
