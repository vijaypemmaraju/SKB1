import { defineQuery } from "bitecs";
import World from "../World";
import Input, { Direction } from "../components/Input";
import Destination from "../components/Destination";
import Map from "../components/Map";
import Collidable from "../components/Colllidable";
import Position from "../components/Position";
import Pushable from "../components/Pushable";
import Icy from "../components/Icy";
import Sprite from "../components/Sprite";
import sprites from "../resources/sprites";
import animations from "../resources/animations";

const inputQuery = defineQuery([Destination, Input, Sprite]);
const collidableQuery = defineQuery([Collidable, Position]);
const pushableQuery = defineQuery([Pushable, Position]);
const mapQuery = defineQuery([Map]);
const icyQuery = defineQuery([Position, Icy]);

const mapMovementSystem = (world: World) => {
  const inputs = inputQuery(world);
  const map = mapQuery(world)[0];
  const collidables = collidableQuery(world);
  const pushables = pushableQuery(world);
  const icies = icyQuery(world);
  const worldMap = world.map;
  for (let i = 0; i < inputs.length; i++) {
    const eid = inputs[i];
    console.log(worldMap[Position.y[eid]]?.[Position.x[eid]]);
    let input = Input.direction[eid];
    let lastInput = Input.lastDirection[eid];

    let isInput = false;

    // if input was just pressed
    if (
      input & Direction.Up &&
      !(lastInput & Direction.Up) &&
      worldMap[Destination.y[eid] - 1]?.[Destination.x[eid]] === 1
    ) {
      Destination.y[eid] -= 1;
      isInput = true;
    }
    if (
      input & Direction.Down &&
      !(lastInput & Direction.Down) &&
      worldMap[Destination.y[eid] + 1]?.[Destination.x[eid]] === 1
    ) {
      Destination.y[eid] += 1;
      isInput = true;
    }
    if (
      input & Direction.Left &&
      !(lastInput & Direction.Left) &&
      worldMap[Destination.y[eid]]?.[Destination.x[eid] - 1] === 1
    ) {
      Destination.x[eid] -= 1;
      isInput = true;
    }
    if (
      input & Direction.Right &&
      !(lastInput & Direction.Right) &&
      worldMap[Destination.y[eid]]?.[Destination.x[eid] + 1] === 1
    ) {
      Destination.x[eid] += 1;
      isInput = true;
    }

    const sprite = sprites.get(eid);

    if (Input.direction[eid] != Direction.None) {
      if (sprite?.anims.currentAnim?.key !== "Walk") {
        sprite!.anims.setRepeat(0);
        animations.set(eid, {
          key: "Walk",
          repeat: -1,
          showOnStart: true,
        });
      }
    } else {
      if (sprite?.anims.currentAnim?.key !== "Idle") {
        sprite!.anims.setRepeat(0);
        animations.set(eid, {
          key: "Idle",
          repeat: -1,
        });
      }
    }

    if (!isInput) {
      continue;
    }

    const pushed: number[] = [];

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

        if (resolveCollisions(pid, collidables)) {
          continue;
        }

        let isIcy = true;
        while (isIcy) {
          isIcy = resolveIcy(pid, icies, collidables);
        }
        resolveMapBoundaries(pid, world.map);

        if (
          Position.x[pid] !== Destination.x[pid] ||
          Position.y[pid] !== Destination.y[pid]
        ) {
          pushed.push(pid);
        }
      }
    }

    if (resolveCollisions(eid, collidables)) {
      continue;
    }

    let isIcy = true;
    while (isIcy) {
      isIcy = resolveIcy(eid, icies, collidables);
      if (isIcy && resolveCollisions(eid, collidables)) {
        break;
      }
    }
    resolveMapBoundaries(eid, world.map);

    let isCollision = true;
    while (isCollision) {
      isCollision = resolveCollisions(
        eid,
        collidables.filter((c) => !pushed.includes(c))
      );
    }
  }
  return world;
};

const resolveMapBoundaries = (eid: number, map: number[][]) => {
  console.log(map[Destination.y[eid]]?.[Destination.x[eid]]);
  if (map[Destination.y[eid]]?.[Destination.x[eid]] !== 1) {
    Destination.x[eid] = Position.x[eid];
    Destination.y[eid] = Position.y[eid];
  }
};

const resolveCollisions = (eid: number, collidables: number[]): boolean => {
  let foundCollision = false;
  for (let i = 0; i < collidables.length; i++) {
    const cid = collidables[i];
    if (cid === eid) {
      continue;
    }
    if (
      Destination.x[cid] === Destination.x[eid] &&
      Destination.y[cid] === Destination.y[eid]
    ) {
      foundCollision = true;
      if (Position.x[eid] < Destination.x[eid]) {
        Destination.x[eid] -= 1;
      }
      if (Position.x[eid] > Destination.x[eid]) {
        Destination.x[eid] += 1;
      }
      if (Position.y[eid] < Destination.y[eid]) {
        Destination.y[eid] -= 1;
      }
      if (Position.y[eid] > Destination.y[eid]) {
        Destination.y[eid] += 1;
      }
    }
  }
  return foundCollision;
};

const resolveIcy = (
  eid: number,
  icys: number[],
  collidables: number[]
): boolean => {
  let foundIcy = false;
  for (let j = 0; j < icys.length; j++) {
    const iid = icys[j];
    if (iid === eid) {
      continue;
    }
    if (
      Position.x[iid] === Destination.x[eid] &&
      Position.y[iid] === Destination.y[eid]
    ) {
      if (
        Position.x[eid] < Destination.x[eid] &&
        !wouldCollide(Destination.x[eid] + 1, Destination.y[eid], collidables)
      ) {
        foundIcy = true;
        Destination.x[eid] += 1;
      }
      if (
        Position.x[eid] > Destination.x[eid] &&
        !wouldCollide(Destination.x[eid] - 1, Destination.y[eid], collidables)
      ) {
        foundIcy = true;
        Destination.x[eid] -= 1;
      }
      if (
        Position.y[eid] < Destination.y[eid] &&
        !wouldCollide(Destination.x[eid], Destination.y[eid] + 1, collidables)
      ) {
        foundIcy = true;
        Destination.y[eid] += 1;
      }
      if (
        Position.y[eid] > Destination.y[eid] &&
        !wouldCollide(Destination.x[eid], Destination.y[eid] - 1, collidables)
      ) {
        foundIcy = true;
        Destination.y[eid] -= 1;
      }
    }
  }
  return foundIcy;
};

const wouldCollide = (x: number, y: number, collidables: number[]): boolean => {
  for (let i = 0; i < collidables.length; i++) {
    const cid = collidables[i];
    if (Position.x[cid] === x && Position.y[cid] === y) {
      return true;
    }
  }
  return false;
};

export default mapMovementSystem;
