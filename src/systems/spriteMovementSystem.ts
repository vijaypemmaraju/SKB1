import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";
import Sprite from "../components/Sprite";

const movementQuery = defineQuery([
  Sprite,
  Position,
  Rotation,
  Scale,
  Velocity,
]);

const spriteMovementSystem = (world: World) => {
  const ents = movementQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
    if (sprite) {
      sprite.x = Position.x[eid];
      sprite.y = Position.y[eid];
      sprite.rotation = Rotation.angle[eid];
      sprite.scale.x = Scale.x[eid];
      sprite.scale.y = Scale.y[eid];
    }
  }
  return world;
};

export default spriteMovementSystem;
