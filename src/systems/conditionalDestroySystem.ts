import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import World from "../World";
import sprites from "../resources/sprites";
import SpriteComponent from "../components/Sprite";
import game from "../game";
import textures from "../resources/textures";
import Texture from "../components/Texture";
import ConditionalDestroy from "../components/CoditionalDestroy";
import conditionalDestroys from "../resources/conditionalDestroys";

const spriteQuery = defineQuery([SpriteComponent, ConditionalDestroy]);

const conditionalDestroySystem = (world: World) => {
  const ents = spriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
    if (sprite) {
      conditionalDestroys.get(eid)?.forEach((conditionalDestroy) => {
        if (conditionalDestroy()) {
          sprite.destroy();
          sprites.delete(eid);
          removeEntity(world, eid);
        }
      });
    }
  }

  return world;
};

export default conditionalDestroySystem;
