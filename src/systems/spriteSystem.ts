import { defineQuery, enterQuery, exitQuery } from "bitecs";
import World from "../World";
import sprites from "../resources/sprites";
import SpriteComponent from "../components/Sprite";
import { Sprite } from "pixi.js";
import app from "../app";

const spriteQuery = defineQuery([SpriteComponent]);

const spriteSystem = (world: World) => {
  const enteringSprites = enterQuery(spriteQuery)(world);
  const exitingSprites = exitQuery(spriteQuery)(world);
  for (let i = 0; i < enteringSprites.length; i++) {
    console.log("enteringSprites", enteringSprites);
    const eid = enteringSprites[i];
    const sprite = new Sprite();
    sprites.set(eid, sprite);
    app.stage.addChild(sprite);
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
      sprite.anchor.set(SpriteComponent.anchor[eid]);
    }
  }
  return world;
};

export default spriteSystem;
