import { Not, defineQuery } from "bitecs";
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
import Shader from "../components/Shader";

const spriteQuery = defineQuery([
  GameObject,
  Position,
  Rotation,
  Scale,
  Velocity,
  Texture,
  Not(AnimatedSprite),
  Not(Shader),
]);

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

const spriteFramingSystem = (world: World) => {
  const ents = spriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const gameObject = gameObjects.get(eid) as Phaser.GameObjects.Sprite;
    if (!gameObject) {
      continue;
    }
    gameObject.setFrame(Texture.frame[eid]);
  }
  return world;
};

export default spriteFramingSystem;
