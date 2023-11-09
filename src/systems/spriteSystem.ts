import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import gameObjects from "../resources/gameObjects";
import SpriteComponent from "../components/GameObject";
import game from "../game";
import textures from "../resources/textures";
import Texture from "../components/Texture";
import Anchor from "../components/Anchor";

const spriteQuery = defineQuery([SpriteComponent]);

const spriteSystem = (world: World) => {
  const enteringSprites = enterQuery(spriteQuery)(world);
  const exitingSprites = exitQuery(spriteQuery)(world);
  for (let i = 0; i < enteringSprites.length; i++) {
    const eid = enteringSprites[i];
    const texture = textures.get(eid);
    if (!texture) {
      continue;
    }
    let sprite;
    if (texture === "autotile") {
      sprite = new Phaser.GameObjects.Sprite(
        game.scene.scenes[0],
        0,
        0,
        texture,
        Texture.frame[eid]
      );
    } else {
      sprite = game.scene.scenes[0].add.sprite(
        0,
        0,
        texture,
        Texture.frame[eid]
      );
    }
    gameObjects.set(eid, sprite);
  }
  for (let i = 0; i < exitingSprites.length; i++) {
    const eid = exitingSprites[i];
    const sprite = gameObjects.get(eid);
    if (sprite) {
      sprite.destroy();
      gameObjects.delete(eid);
    }
  }

  const ents = spriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = gameObjects.get(eid) as Phaser.GameObjects.Sprite;
    if (sprite) {
      sprite.setOrigin(Anchor.x[eid], Anchor.y[eid]);
    }
  }

  return world;
};

export default spriteSystem;
