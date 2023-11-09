import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import World from "../World";
import gameObjects from "../resources/gameObjects";
import GameObject from "../components/GameObject";
import game from "../game";
import textures from "../resources/textures";
import Texture from "../components/Texture";
import ConditionalDestroy from "../components/ConditionalDestroy";
import conditionalDestroys from "../resources/conditionalDestroys";

const gameObjectQuery = defineQuery([GameObject, ConditionalDestroy]);

const conditionalDestroySystem = (world: World) => {
  const ents = gameObjectQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = gameObjects.get(eid);
    if (sprite) {
      conditionalDestroys.get(eid)?.forEach((conditionalDestroy) => {
        if (conditionalDestroy()) {
          sprite.destroy();
          gameObjects.delete(eid);
          removeEntity(world, eid);
        }
      });
    }
  }

  return world;
};

export default conditionalDestroySystem;
