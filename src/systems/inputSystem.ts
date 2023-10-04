import { defineQuery } from "bitecs";
import World from "../World";
import game from "../game";
import Input from "../components/Input";
import Destination from "../components/Destination";
import Position from "../components/Position";

const inputQuery = defineQuery([Input, Position, Destination]);

const inputSystem = (world: World) => {
  const ents = inputQuery(world);
  const up = game.scene.scenes[0].input.keyboard?.addKey("up");
  const down = game.scene.scenes[0].input.keyboard?.addKey("down");
  const left = game.scene.scenes[0].input.keyboard?.addKey("left");
  const right = game.scene.scenes[0].input.keyboard?.addKey("right");
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    if (
      Position.x[eid] !== Destination.x[eid] ||
      Position.y[eid] !== Destination.y[eid]
    ) {
      Input.lastDirection[eid] = Input.direction[eid];
      Input.direction[eid] = 0;
      continue;
    }
    let input = 0;
    if (up?.isDown) {
      input = 1;
    }
    if (down?.isDown) {
      input = 2;
    }
    if (left?.isDown) {
      input = 4;
    }
    if (right?.isDown) {
      input = 8;
    }
    Input.lastDirection[eid] = Input.direction[eid];
    Input.direction[eid] = input;
  }
  return world;
};

export default inputSystem;
