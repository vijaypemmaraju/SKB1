import { defineQuery } from "bitecs";
import World from "../World";
import game from "../game";
import Input, { Direction } from "../components/Input";
import Destination from "../components/Destination";
import Map from "../components/Map";
import Collidable from "../components/Colllidable";
import Position from "../components/Position";
import Pushable from "../components/Pushable";

const inputQuery = defineQuery([Destination, Input]);
const collidableQuery = defineQuery([Collidable, Position]);
const pushableQuery = defineQuery([Pushable, Position]);
const mapQuery = defineQuery([Map]);
const mapMovementSystem = (world: World) => {
  const inputs = inputQuery(world);
  const map = mapQuery(world)[0];
  const collidables = collidableQuery(world);
  const pushables = pushableQuery(world);
  for (let i = 0; i < inputs.length; i++) {
    const eid = inputs[i];
    let input = Input.direction[eid];
    let lastInput = Input.lastDirection[eid];

    let isInput = false;

    // if input was just pressed
    if (input & Direction.Up && !(lastInput & Direction.Up)) {
      Destination.y[eid] -= 1;
      isInput = true;
    }
    if (input & Direction.Down && !(lastInput & Direction.Down)) {
      Destination.y[eid] += 1;
      isInput = true;
    }
    if (input & Direction.Left && !(lastInput & Direction.Left)) {
      Destination.x[eid] -= 1;
      isInput = true;
    }
    if (input & Direction.Right && !(lastInput & Direction.Right)) {
      Destination.x[eid] += 1;
      isInput = true;
    }

    resolveMapBoundaries(eid, map);

    if (!isInput) {
      continue;
    }

    const pushed = [];

    for (let j = 0; j < pushables.length; j++) {
      const pid = pushables[j];
      if (
        Position.x[pid] === Destination.x[eid] &&
        Position.y[pid] === Destination.y[eid]
      ) {
        if (input & Direction.Up) {
          Destination.y[pid] -= 1;
        }
        if (input & Direction.Down) {
          Destination.y[pid] += 1;
        }
        if (input & Direction.Left) {
          Destination.x[pid] -= 1;
        }
        if (input & Direction.Right) {
          Destination.x[pid] += 1;
        }

        resolveMapBoundaries(pid, map);
        resolveCollisions(pid, collidables);
        if (
          Position.x[pid] !== Destination.x[pid] ||
          Position.y[pid] !== Destination.y[pid]
        ) {
          pushed.push(pid);
        }
      }
    }

    for (let j = 0; j < collidables.length; j++) {
      const cid = collidables[j];
      if (pushed.includes(cid)) {
        continue;
      }
      if (
        Position.x[cid] === Destination.x[eid] &&
        Position.y[cid] === Destination.y[eid]
      ) {
        Destination.x[eid] = Math.floor(Position.x[eid]);
        Destination.y[eid] = Math.floor(Position.y[eid]);
      }
    }
  }
  return world;
};

const resolveMapBoundaries = (eid: number, map: number) => {
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
};

const resolveCollisions = (eid: number, collidables: number[]) => {
  for (let i = 0; i < collidables.length; i++) {
    const cid = collidables[i];
    if (
      Position.x[cid] === Destination.x[eid] &&
      Position.y[cid] === Destination.y[eid]
    ) {
      Destination.x[eid] = Math.floor(Position.x[eid]);
      Destination.y[eid] = Math.floor(Position.y[eid]);
    }
  }
};

export default mapMovementSystem;
