import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import sprites from "../resources/sprites";
import SpriteComponent from "../components/Sprite";
import game from "../game";
import textures from "../resources/textures";
import Texture from "../components/Texture";

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
    const sprite = game.scene.scenes[0].add.sprite(
      0,
      0,
      texture,
      Texture.frame[eid]
    );
    // const text = game.scene.scenes[0].add.text(
    //   0,
    //   0,
    //   Texture.frame[eid].toString(),
    //   {
    //     fontFamily: "monospace",
    //     fontSize: "8px",
    //     color: "#ffffff",
    //   }
    // );
    // sprite.text = text;
    // text.depth = 1000;
    sprites.set(eid, sprite);
  }
  for (let i = 0; i < exitingSprites.length; i++) {
    const eid = exitingSprites[i];
    const sprite = sprites.get(eid);
    if (sprite) {
      sprite.destroy();
      sprites.delete(eid);
    }
  }

  const ents = spriteQuery(world);
  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const sprite = sprites.get(eid);
    if (sprite) {
      const anchor = SpriteComponent.anchor[eid];
      sprite.setOrigin(anchor, anchor);
    }
  }

  return world;
};

export default spriteSystem;
