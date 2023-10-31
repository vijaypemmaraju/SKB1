import { defineQuery } from "bitecs";
import World from "../World";
import Position from "../components/Position";
import Rotation from "../components/Rotation";
import Scale from "../components/Scale";
import Velocity from "../components/Velocity";
import sprites from "../resources/sprites";
import Sprite from "../components/Sprite";
import Texture from "../components/Texture";
import animations from "../resources/animations";
import textures from "../resources/textures";
import getCanvasPosition from "../utils/getCanvasPosition";

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
  const entsSortedByDepth = ents.sort((a, b) => {
    return Position.z[a] - Position.z[b];
  });
  world.renderTexture.beginDraw();
  for (let i = 0; i < entsSortedByDepth.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
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
      world.renderTexture.batchDrawFrame(
        textures.get(eid),
        Texture.frame[eid],
        screenPosition.x,
        screenPosition.y
        // sprite.x,
        // sprite.y
      );
      // const text = sprite.text;
      // if (text) {
      //   text.x = sprite.x;
      //   text.y = sprite.y;
      //   text.text = sprite.depth.toString();
      // }
      if (Sprite.animated[eid]) {
        const animation = animations.get(
          eid
        ) as Phaser.Types.Animations.PlayAnimationConfig;
        if (animation && sprite.anims.currentAnim?.key !== animation.key) {
          if (animation.showOnStart) {
            sprite.play(animation);
          } else {
            sprite.playAfterRepeat(animation);
          }
        }
      } else {
        sprite.setFrame(Texture.frame[eid]);
      }
    }
  }
  world.renderTexture.endDraw();
  return world;
};

export default spriteRenderingSystem;
