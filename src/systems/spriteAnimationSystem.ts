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

const animatedSpriteQuery = defineQuery([
  GameObject,
  Position,
  Rotation,
  Scale,
  Velocity,
  Texture,
  AnimatedSprite,
]);

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

const spriteAnimationSystem = (world: World) => {
  const ents = animatedSpriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = gameObjects.get(eid) as Phaser.GameObjects.Sprite;
    if (sprite) {
      sprite.x = Position.x[eid] * TILE_WIDTH;
      const animation = animations.get(
        eid,
      ) as Phaser.Types.Animations.PlayAnimationConfig;
      if (animation && sprite.anims.currentAnim?.key !== animation.key) {
        if (animation.showOnStart) {
          sprite.play(animation);
        } else {
          sprite.playAfterRepeat(animation);
        }
      }
    }
  }
  return world;
};

export default spriteAnimationSystem;
