import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";

const movementQuery = defineQuery([Position, Rotation, Scale, Velocity]);

const movementSystem = (world: World) => {
  const {
    time: { delta },
  } = world;
  const ents = movementQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    Position.x[eid] += Velocity.x[eid] * delta;
    Position.y[eid] += Velocity.y[eid] * delta;
    Position.z[eid] += Velocity.z[eid] * delta;
  }
  return world;
};

export default movementSystem;
