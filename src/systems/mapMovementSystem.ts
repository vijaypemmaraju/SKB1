import { defineQuery } from "bitecs";
import World from "../World";
import Input, { Direction } from "../components/Input";
import Destination from "../components/Destination";
import Map from "../components/Map";
import Collidable from "../components/Colllidable";
import Position from "../components/Position";
import Pushable from "../components/Pushable";
import Icy from "../components/Icy";
import GameObject from "../components/GameObject";
import gameObjects from "../resources/gameObjects";
import animations from "../resources/animations";
import Velocity from "../components/Velocity";
import { TILE_HEIGHT, TILE_WIDTH } from "./gameObjectRenderingSystem";

const inputQuery = defineQuery([Velocity, Input, GameObject]);
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
    let input = Input.direction[eid];
    let lastInput = Input.lastDirection[eid];

    let isInput = false;

    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    const shouldCheckExclusiveInput = pushables.length > 0;

    let isUp = !!(input & Direction.Up);
    let isDown = !!(input & Direction.Down);
    let isLeft = !!(input & Direction.Left);
    let isRight = !!(input & Direction.Right);

    if (shouldCheckExclusiveInput) {
      isUp = isUp && !(lastInput & Direction.Up);
      isDown = isDown && !(lastInput & Direction.Down);
      isLeft = isLeft && !(lastInput & Direction.Left);
      isRight = isRight && !(lastInput & Direction.Right);
    }

    // if input was just pressed
    if (isUp) {
      Velocity.y[eid] = -1;
      isInput = true;
    }
    if (isDown) {
      Velocity.y[eid] = 1;
      isInput = true;
    }
    if (isLeft) {
      Velocity.x[eid] = -1;
      isInput = true;
    }
    if (isRight) {
      Velocity.x[eid] = 1;
      isInput = true;
    }
    const sprite = gameObjects.get(eid) as Phaser.GameObjects.Sprite;

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
      if (pushables.length === 0) {
        Destination.x[eid] = Position.x[eid];
        Destination.y[eid] = Position.y[eid];
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
      }
      return world;
    }

    // // normalize velocity
    // if (Math.abs(Velocity.x[eid]) > 0 || Math.abs(Velocity.y[eid]) > 0) {
    //   const mag = Math.sqrt(
    //     Velocity.x[eid] * Velocity.x[eid] + Velocity.y[eid] * Velocity.y[eid]
    //   );
    //   Velocity.x[eid] /= mag;
    //   Velocity.y[eid] /= mag;
    // }

    Destination.x[eid] = Position.x[eid] + Math.sign(Velocity.x[eid]);
    Destination.y[eid] = Position.y[eid] + Math.sign(Velocity.y[eid]);

    // round destination to nearest multiple of TILE_SIZE
    const mapPosition = {
      x: Math.round(Destination.x[eid]),
      y: Math.round(Destination.y[eid]),
    };
    // if (Velocity.x[eid] > 0) {
    //   Destination.x[eid] = Math.ceil(Destination.x[eid]);
    // }

    // if (Velocity.x[eid] < 0) {
    //   Destination.x[eid] = Math.floor(Destination.x[eid]);
    // }

    // if (Velocity.y[eid] > 0) {
    //   Destination.y[eid] = Math.ceil(Destination.y[eid]);
    // }

    // if (Velocity.y[eid] < 0) {
    //   Destination.y[eid] = Math.floor(Destination.y[eid]);
    // }

    // if (Velocity.x[eid] === 0 && Velocity.y[eid] === 0) {
    //   Destination.x[eid] = Math.round(Destination.x[eid]);
    //   Destination.y[eid] = Math.round(Destination.y[eid]);
    // }

    if (worldMap[mapPosition.y]?.[mapPosition.x] !== 1) {
      Destination.x[eid] = Position.x[eid];
      Destination.y[eid] = Position.y[eid];
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;
    }

    if (!isInput) {
      continue;
    }

    const pushed: number[] = [];

    for (let j = 0; j < pushables.length; j++) {
      const pid = pushables[j];
      if (true) {
        if (input & Direction.Up && !(lastInput & Direction.Up)) {
          Destination.y[pid] -= 1;
        }
        if (input & Direction.Down && !(lastInput & Direction.Down)) {
          Destination.y[pid] += 1;
        }
        if (input & Direction.Left && !(lastInput & Direction.Left)) {
          Destination.x[pid] -= 1;
        }
        if (input & Direction.Right && !(lastInput & Direction.Right)) {
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
  const mapPosition = {
    x: Math.round(Destination.x[eid]),
    y: Math.round(Destination.y[eid]),
  };

  if (map[mapPosition.y]?.[mapPosition.x] !== 1) {
    Destination.x[eid] = Position.x[eid];
    Destination.y[eid] = Position.y[eid];
  }
};

const resolveCollisions = (eid: number, collidables: number[]): boolean => {
  let foundCollision = false;

  const left = Position.x[eid];
  const top = Position.y[eid];
  const right = Position.x[eid] + 1;
  const bottom = Position.y[eid] + 1;
  const centerX = Position.x[eid] + 0.5;
  const centerY = Position.y[eid] + 0.5;
  const detectionWidth = 0.9;

  for (let i = 0; i < collidables.length; i++) {
    const cid = collidables[i];
    if (cid === eid) {
      continue;
    }

    const left2 = Position.x[cid];
    const top2 = Position.y[cid];
    const right2 = Position.x[cid] + 1;
    const bottom2 = Position.y[cid] + 1;

    if (
      left < right2 &&
      left + detectionWidth > right2 &&
      centerY > top2 &&
      centerY < bottom2
    ) {
      Destination.x[eid] = left2 + 1;
    }

    if (
      right > left2 &&
      right - detectionWidth < left2 &&
      centerY > top2 &&
      centerY < bottom2
    ) {
      Destination.x[eid] = left2 - 1;
    }

    if (
      top < bottom2 &&
      top + detectionWidth > bottom2 &&
      centerX > left2 &&
      centerX < right2
    ) {
      Destination.y[eid] = top2 + 1;
    }

    if (
      bottom > top2 &&
      bottom - detectionWidth < top2 &&
      centerX > left2 &&
      centerX < right2
    ) {
      Destination.y[eid] = top2 - 1;
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
