import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import textures, { texturePaths } from "../resources/textures";
import TextureComponent from "../components/Texture";
import { Texture } from "pixi.js";

const textureQuery = defineQuery([TextureComponent]);

const textureSystem = (world: World) => {
  const enteringTextures = enterQuery(textureQuery)(world);
  const exitingTextures = exitQuery(textureQuery)(world);
  for (let i = 0; i < enteringTextures.length; i++) {
    const eid = enteringTextures[i];
    const path = texturePaths.get(eid);
    if (!path) continue;
    const texture = Texture.from(path);
    textures.set(eid, texture);
  }
  for (let i = 0; i < exitingTextures.length; i++) {
    const eid = exitingTextures[i];
    const texture = textures.get(eid);
    if (texture) {
      texture.destroy();
      textures.delete(eid);
    }
  }
  return world;
};

export default textureSystem;
