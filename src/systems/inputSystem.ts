import { defineQuery, enterQuery } from "bitecs";
import World from "../World";
import game from "../game";
import Input from "../components/Input";
import Destination from "../components/Destination";
import Position from "../components/Position";
import Map from "../components/Map";
import useStore from "../useStore";
import Velocity from "../components/Velocity";

const inputQuery = defineQuery([Input, Position, Velocity]);
const mapQuery = defineQuery([Map]);
const inputSystem = (world: World) => {
  const ents = inputQuery(world);
  const up = game.scene.scenes[0].input.keyboard?.addKey("up");
  const down = game.scene.scenes[0].input.keyboard?.addKey("down");
  const left = game.scene.scenes[0].input.keyboard?.addKey("left");
  const right = game.scene.scenes[0].input.keyboard?.addKey("right");
  const swipe = useStore.getState().swipe;
  const map = enterQuery(mapQuery)(world);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    let input = 0;
    if (up?.isDown || swipe.up) {
      input += 1;
    }
    if (down?.isDown || swipe.down) {
      input += 2;
    }
    if (left?.isDown || swipe.left) {
      input += 4;
    }
    if (right?.isDown || swipe.right) {
      input += 8;
    }

    Input.lastDirection[eid] = Input.direction[eid];
    Input.direction[eid] = input;
  }
  return world;
};

export default inputSystem;
