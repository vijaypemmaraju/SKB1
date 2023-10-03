import { defineQuery } from "bitecs";
import World from "../World";
import game from "../game";
import Input, { Direction } from "../components/Input";
import Destination from "../components/Destination";
import Map from "../components/Map";

const inputQuery = defineQuery([Destination, Input]);
const mapQuery = defineQuery([Map]);
const mapMovementSystem = (world: World) => {
  const ents = inputQuery(world);
  const map = mapQuery(world)[0];
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    let input = Input.direction[eid];
    let lastInput = Input.lastDirection[eid];

    // if input was just pressed
    if (input & Direction.Up && !(lastInput & Direction.Up)) {
      Destination.y[eid] -= 1;
    }
    if (input & Direction.Down && !(lastInput & Direction.Down)) {
      Destination.y[eid] += 1;
    }
    if (input & Direction.Left && !(lastInput & Direction.Left)) {
      Destination.x[eid] -= 1;
    }
    if (input & Direction.Right && !(lastInput & Direction.Right)) {
      Destination.x[eid] += 1;
    }

    if (Destination.x[eid] < 0) {
      Destination.x[eid] = 0;
    }
    if (Destination.x[eid] > Map.width[map] - 1) {
      Destination.x[eid] = Map.width[map] - 1;
    }
    if (Destination.y[eid] < 0) {
      Destination.y[eid] = 0;
    }
    if (Destination.y[eid] > Map.height[map] - 1) {
      Destination.y[eid] = Map.height[map] - 1;
    }
  }
  return world;
};

export default mapMovementSystem;
