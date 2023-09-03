import { defineQuery } from "bitecs";
import World from "../World";
import sprites from "../resources/sprites";
import SpriteComponent from "../components/Sprite";
import Texture from "../components/Texture";
import textures from "../resources/textures";

const spriteTextureQuery = defineQuery([SpriteComponent, Texture]);

const spriteTextureSystem = (world: World) => {
  const ents = spriteTextureQuery(world);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
    const texture = textures.get(eid);
    if (sprite && texture) {
      sprite.texture = texture;
    }
  }
  return world;
};

export default spriteTextureSystem;
