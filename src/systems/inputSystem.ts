import { defineQuery } from "bitecs";
import World from "../World";
import game from "../game";
import Input from "../components/Input";

const inputQuery = defineQuery([Input]);

const inputSystem = (world: World) => {
  const ents = inputQuery(world);
  const up = game.scene.scenes[0].input.keyboard?.addKey("up");
  const down = game.scene.scenes[0].input.keyboard?.addKey("down");
  const left = game.scene.scenes[0].input.keyboard?.addKey("left");
  const right = game.scene.scenes[0].input.keyboard?.addKey("right");
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    let input = 0;
    if (up?.isDown) {
      input |= 1;
    }
    if (game.scene.scenes[0].input.keyboard?.checkDown(down!)) {
      input |= 2;
    }
    if (game.scene.scenes[0].input.keyboard?.checkDown(left!)) {
      input |= 4;
    }
    if (game.scene.scenes[0].input.keyboard?.checkDown(right!)) {
      input |= 8;
    }
    Input.lastDirection[eid] = Input.direction[eid];
    Input.direction[eid] = input;
  }
  return world;
};

export default inputSystem;
