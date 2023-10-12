import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import Destination from "../components/Destination";

const destinationQuery = defineQuery([Position, Destination, Velocity]);

const SPEED = 8;

const destinationSystem = (world: World) => {
  const {
    time: { delta },
  } = world;
  const ents = destinationQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const dx = Destination.x[eid] - Position.x[eid];
    const dy = Destination.y[eid] - Position.y[eid];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < delta * SPEED) {
      Position.x[eid] = Destination.x[eid];
      Position.y[eid] = Destination.y[eid];
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
      continue;
    }

    if (dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const vx = nx * SPEED;
      const vy = ny * SPEED;
      Velocity.x[eid] = vx;
      Velocity.y[eid] = vy;
    } else {
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
    }
  }
  return world;
};

export default destinationSystem;
