import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";
import Sprite from "../components/Sprite";
import Texture from "../components/Texture";

const spriteQuery = defineQuery([
  Sprite,
  Position,
  Rotation,
  Scale,
  Velocity,
  Texture,
]);

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

const spriteRenderingSystem = (world: World) => {
  const ents = spriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
    if (sprite) {
      sprite.x = Position.x[eid] * TILE_WIDTH;
      sprite.y = Position.y[eid] * TILE_HEIGHT;
      sprite.depth = Position.z[eid];
      sprite.rotation = Rotation.angle[eid];
      sprite.scaleX = Scale.x[eid];
      sprite.scaleY = Scale.y[eid];
      sprite.setFrame(Texture.frame[eid]);
    }
  }
  return world;
};

export default spriteRenderingSystem;
