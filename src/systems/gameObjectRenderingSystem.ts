import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import gameObjects from "../resources/gameObjects";
import GameObject from "../components/GameObject";
import Texture from "../components/Texture";
import animations from "../resources/animations";
import textures from "../resources/textures";
import getCanvasPosition from "../utils/getCanvasPosition";
import AnimatedSprite from "../components/AnimatedSprite";

const gameObjectQuery = defineQuery([
  GameObject,
  Position,
  Rotation,
  Scale,
  Velocity,
  Texture,
]);

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

const gameObjectRenderingSystem = (world: World) => {
  const ents = gameObjectQuery(world);
  const entsSortedByDepth = ents.sort((a, b) => {
    return Position.z[a] - Position.z[b];
  });
  world.renderTexture.beginDraw();
  for (let i = 0; i < entsSortedByDepth.length; i++) {
    const eid = ents[i];
    const sprite = gameObjects.get(eid) as Phaser.GameObjects.Sprite;
    if (sprite) {
      sprite.x = Position.x[eid] * TILE_WIDTH;
      sprite.y = Position.y[eid] * TILE_HEIGHT;
      sprite.depth = Position.z[eid];
      sprite.rotation = Rotation.angle[eid];
      sprite.scaleX = Scale.x[eid];
      sprite.scaleY = Scale.y[eid];
      const camera = world.currentCamera;

      const screenPosition = getCanvasPosition(sprite, camera);
      // get screen point
      const texture = textures.get(eid);
      if (texture === "autotile") {
        world.renderTexture.batchDrawFrame(
          textures.get(eid)!,
          Texture.frame[eid],
          screenPosition.x,
          screenPosition.y
        );
      }
    }
  }
  world.renderTexture.endDraw();
  return world;
};

export default gameObjectRenderingSystem;
